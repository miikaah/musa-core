import fuzzysort from "fuzzysort";
import uniqBy from "lodash.uniqby";

import { getArtistAlbums } from "./artist";
import { getAlbumById } from "./album";
import { getAudioById } from "./audio";
import { findAudiosByMetadataAndFilename, findAlbumsByMetadata } from "../db";
import { artistsForFind, albumsForFind, audiosForFind, audioCollection } from "../scanner";
import { tokenize, calculateOkapiBm25Score } from "../full-text-search";

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
  query = query.toLowerCase();

  if (query.length < 2) {
    return {
      artists: [],
      albums: [],
      audios: [],
    };
  }
  const options = { limit, key: "name", threshold: -50 };
  const foundArtists = fuzzysort.go(query, artistsForFind, options);
  const artists = (await Promise.all(
    foundArtists
      .map((a) => a.obj)
      .filter(Boolean)
      .map(async (a) => getArtistAlbums(a.id))
  )) as Artist[];

  const foundAlbums = await findAlbumsByMetadata(query, limit);

  if (foundAlbums.length < limit && artists.length > 0) {
    artists.forEach((a) => {
      // @ts-expect-error nope
      foundAlbums.push(...a.albums);
    });
  }

  const albums = (await Promise.all(
    foundAlbums
      .filter(Boolean)
      .slice(0, limit * 2)
      // @ts-expect-error stfu
      .map(async (a) => getAlbumById(a.id || a.path_id))
  )) as AlbumWithFilesAndMetadata[];

  const foundAudios = await findAudiosByMetadataAndFilename(query, limit * 2);
  const audios = (
    (await Promise.all(
      foundAudios.map(async (a) => getAudioById({ id: a.path_id, existingDbAudio: a }))
    )) as AudioWithMetadata[]
  ).filter(({ id }) => !!audioCollection[id]);

  const k1 = 1.2;
  const b = 0.75;
  const terms = tokenize(query);

  return {
    artists: artists.sort(byOkapiBm25(terms, k1, b, true)),
    albums: uniqBy(albums, ({ id }: { id: string }) => id).sort(byOkapiBm25(terms, k1, b)),
    audios: audios.sort(byOkapiBm25(terms, k1, b)),
  };
};

function byOkapiBm25(terms: string[], k1: number, b: number, isArtist = false) {
  // @ts-expect-error not useful here
  return (a, c) => {
    const tca = (isArtist ? a.name : a?.metadata?.title) || "";
    const tcc = (isArtist ? c.name : c?.metadata?.title) || "";

    if (!tca || !tcc) {
      return 1;
    }

    const aScore = terms
      .map((term) => calculateOkapiBm25Score(term, tca.length, k1, b))
      .reduce((acc, score) => acc + score, 0);
    const cScore = terms
      .map((term) => calculateOkapiBm25Score(term, tcc.length, k1, b))
      .reduce((acc, score) => acc + score, 0);

    if (aScore === 0 && cScore === 0 && tca.toLowerCase().startsWith(terms[0])) {
      return -1;
    }

    return cScore - aScore;
  };
}

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
