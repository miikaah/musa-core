import fuzzysort from "fuzzysort";

import { getArtistAlbums } from "./artist";
import { getAlbumById } from "./album";
import { getAudioById } from "./audio";
import { findAudiosByMetadataAndFilename } from "../db";
import { artistsForFind, albumsForFind, audiosForFind, audioCollection } from "../scanner";

import { Artist } from "./artist.types";
import { AlbumWithFilesAndMetadata } from "./album.types";
import { AudioWithMetadata } from "./audio.types";
import { ArtistsForFind, AlbumsForFind, AudiosForFind, ArtistWithId } from "../scanner.types";
import { FindResult } from "./find.types";

const options = { limit: 4, key: "name", threshold: -50 };

export const find = async ({ query }: { query: string }): Promise<FindResult> => {
  if (query.length < 1) {
    return {
      artists: [],
      albums: [],
      audios: [],
    };
  }
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

function getRandomNumber(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function getRandomNumbers(min: number, max: number, amount: number) {
  const randomNumbers: number[] = [];

  for (let i = 0; i < amount; i++) {
    randomNumbers.push(getRandomNumber(min, max));
  }

  return randomNumbers;
}

type Entities = ArtistsForFind | AlbumsForFind | AudiosForFind;

function getRandomEntities(entitiesForFind: Entities, indices: number[]) {
  const entities: ArtistWithId[] = [];

  for (const index of indices) {
    entities.push(entitiesForFind.at(index) as ArtistWithId);
  }

  return entities.filter(Boolean);
}

export const findRandom = async (): Promise<FindResult> => {
  const artistIndices = getRandomNumbers(0, artistsForFind.length, 4);
  const foundArtists = getRandomEntities(artistsForFind, artistIndices);
  const artists = (await Promise.all(
    foundArtists.map(async (a) => getArtistAlbums(a.id))
  )) as Artist[];

  const albumIndices = getRandomNumbers(0, albumsForFind.length, 4);
  const foundAlbums = getRandomEntities(albumsForFind, albumIndices);
  const albums = (await Promise.all(
    foundAlbums.map(async (a) => getAlbumById(a.id))
  )) as AlbumWithFilesAndMetadata[];

  const audioIndices = getRandomNumbers(0, audiosForFind.length, 6);
  const foundAudios = getRandomEntities(audiosForFind, audioIndices);
  const audios = (
    (await Promise.all(
      foundAudios.map(async (a) => getAudioById({ id: a.id }))
    )) as AudioWithMetadata[]
  ).filter(({ id }) => !!audioCollection[id]);

  return {
    artists,
    albums,
    audios,
  };
};
