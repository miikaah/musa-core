import fuzzysort from "fuzzysort";

import { getArtistAlbums } from "./artist";
import { getAlbumById } from "./album";
import { getAudioById } from "./audio";
import { findAudiosByMetadataAndFilename } from "../db";
import { artistsForFind, albumsForFind, audiosForFind, audioCollection } from "../scanner";

import { Artist } from "./artist.types";
import { AlbumWithFilesAndMetadata } from "./album.types";
import { AudioWithMetadata } from "./audio.types";
import { ArtistWithId, AlbumWithId, FileWithId } from "../scanner.types";
import { FindResult } from "./find.types";

export const find = async ({
  query,
  limit = 6,
}: {
  query: string;
  limit?: number;
}): Promise<FindResult> => {
  if (query.length < 1) {
    return {
      artists: [],
      albums: [],
      audios: [],
    };
  }
  const options = { limit, key: "name", threshold: -50 };
  const foundArtists = fuzzysort.go(query, artistsForFind, options);
  const artists = (await Promise.all(
    foundArtists.map((a) => a.obj).map(async (a) => getArtistAlbums(a.id))
  )) as Artist[];

  const foundAlbums = fuzzysort.go(query, albumsForFind, options);
  const albums = (await Promise.all(
    foundAlbums.map((a) => a.obj).map(async (a) => getAlbumById(a.id))
  )) as AlbumWithFilesAndMetadata[];

  const foundAudios = await findAudiosByMetadataAndFilename(query, 6);
  const audios = (
    (await Promise.all(
      foundAudios.map(async (a) => getAudioById({ id: a.path_id, existingDbAudio: a }))
    )) as AudioWithMetadata[]
  ).filter(({ id }) => !!audioCollection[id]);

  return {
    artists,
    albums,
    audios,
  };
};

function getRandomNumber(max: number) {
  return Math.floor(Math.random() * max);
}

function getRandomNumbers(max: number, amount: number) {
  const randomNumbers: number[] = [];

  while (randomNumbers.length < Math.min(amount, max)) {
    const candidate = getRandomNumber(max);

    if (!randomNumbers.includes(candidate)) {
      randomNumbers.push(candidate);
    }
  }

  return randomNumbers;
}

function lookupEntities<T>(entitiesForFind: T[], indices: number[]) {
  const entities: (T | undefined)[] = [];

  for (const index of indices) {
    entities.push(entitiesForFind.at(index));
  }

  return entities.filter(Boolean) as T[];
}

export const findRandom = async ({ limit = 6 }: { limit?: number }): Promise<FindResult> => {
  const artistIndices = getRandomNumbers(artistsForFind.length, limit);
  const foundArtists = lookupEntities<ArtistWithId>(artistsForFind, artistIndices);
  const artists = await Promise.all(foundArtists.map(async (a) => getArtistAlbums(a.id)));

  const albumIndices = getRandomNumbers(albumsForFind.length, limit);
  const foundAlbums = lookupEntities<AlbumWithId>(albumsForFind, albumIndices);
  const albums = await Promise.all(foundAlbums.map(async (a) => getAlbumById(a.id)));

  const audioIndices = getRandomNumbers(audiosForFind.length, limit);
  const foundAudios = lookupEntities<FileWithId>(audiosForFind, audioIndices);
  const audios = (
    await Promise.all(foundAudios.map(async (a) => getAudioById({ id: a.id })))
  ).filter(({ id }) => !!audioCollection[id]);

  return {
    artists,
    albums,
    audios,
  } as FindResult;
};
