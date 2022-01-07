import fuzzysort from "fuzzysort";
import { getArtistAlbums, ApiArtist } from "./artist";
import { getAlbumById, ApiAlbumWithFilesAndMetadata } from "./album";
import { getAudioById, ApiAudioWithMetadata } from "./audio";
import { findAudiosByMetadataAndFilename } from "../db";
import {
  artistsForFind,
  albumsForFind,
  audiosForFind,
  audioCollection,
  ArtistsForFind,
  AlbumsForFind,
  AudiosForFind,
  ArtistWithId,
} from "../scanner";

const options = { limit: 4, key: "name", threshold: -50 };

export type ApiFindResult = {
  artists: ApiArtist[];
  albums: ApiAlbumWithFilesAndMetadata[];
  audios: ApiAudioWithMetadata[];
};

export const find = async ({ query }: { query: string }): Promise<ApiFindResult> => {
  if (query.length < 1) {
    return {
      artists: [],
      albums: [],
      audios: [],
    };
  }
  const foundArtists = fuzzysort.go(query, artistsForFind, options);
  const artists = await Promise.all(
    foundArtists.map((a) => a.obj).map(async (a) => getArtistAlbums(a.id))
  );
  const foundAlbums = fuzzysort.go(query, albumsForFind, options);
  const albums = await Promise.all(
    foundAlbums.map((a) => a.obj).map(async (a) => getAlbumById(a.id))
  );
  const foundAudios = await findAudiosByMetadataAndFilename(query, 6);
  const audios = (
    await Promise.all(
      foundAudios.map(async (a) => getAudioById({ id: a.path_id, existingDbAudio: a }))
    )
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

export const findRandom = async (): Promise<ApiFindResult> => {
  const artistIndices = getRandomNumbers(0, artistsForFind.length, 4);
  const foundArtists = getRandomEntities(artistsForFind, artistIndices);
  const artists = await Promise.all(foundArtists.map(async (a) => getArtistAlbums(a.id)));

  const albumIndices = getRandomNumbers(0, albumsForFind.length, 4);
  const foundAlbums = getRandomEntities(albumsForFind, albumIndices);
  const albums = await Promise.all(foundAlbums.map(async (a) => getAlbumById(a.id)));

  const audioIndices = getRandomNumbers(0, audiosForFind.length, 6);
  const foundAudios = getRandomEntities(audiosForFind, audioIndices);
  const audios = (
    await Promise.all(foundAudios.map(async (a) => getAudioById({ id: a.id })))
  ).filter(({ id }) => !!audioCollection[id]);

  return {
    artists,
    albums,
    audios,
  };
};
