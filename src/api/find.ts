import fuzzysort from "fuzzysort";
import uniqBy from "lodash.uniqby";

import { getArtistAlbums } from "./artist";
import { getAlbumById } from "./album";
import { getAudioById } from "./audio";
import {
  findAudiosByMetadataAndFilename,
  findAlbumsByMetadata,
  findAlbumsByYear,
  findAudiosByYear,
  findAudiosByGenre,
} from "../db";
import { artistsForFind, albumsForFind, audiosForFind, audioCollection } from "../scanner";
import { tokenize, calculateOkapiBm25Score } from "../full-text-search";

import { Artist } from "./artist.types";
import { AlbumWithFilesAndMetadata } from "./album.types";
import { AudioWithMetadata } from "./audio.types";
import { ArtistWithId, AlbumWithId, FileWithId } from "../scanner.types";
import { FindResult } from "./find.types";
import { DbAlbum, DbAudio } from "../db.types";

export const find = async ({
  query,
  limit = 6,
}: {
  query: string;
  limit?: number;
}): Promise<FindResult> => {
  query = query.toLowerCase().trim();

  if (query.length < 2) {
    return {
      artists: [],
      albums: [],
      audios: [],
    };
  }

  const queryAsNumber = parseInt(query, 10);

  //  TODO: Clean up

  // Year search
  if (!isNaN(queryAsNumber)) {
    const foundAlbums = await findAlbumsByYear(queryAsNumber, albumsForFind.length);
    const albums = (
      (await Promise.all(
        foundAlbums
          .filter(Boolean)
          // @ts-expect-error stfu
          .map(async (a) => getAlbumById(a.id || a.path_id))
      )) as AlbumWithFilesAndMetadata[]
    ).filter(({ name }) => name);

    const foundAudios = albums
      .map((a) => a.files)
      .flat(Infinity) as AlbumWithFilesAndMetadata["files"];
    const audios = (
      (await Promise.all(
        foundAudios.map(async (a) => getAudioById({ id: a.id }))
      )) as AudioWithMetadata[]
    ).filter(({ id }) => !!audioCollection[id]);

    // TODO: Add artists
    return {
      artists: [],
      albums: uniqBy(albums, ({ id }: { id: string }) => id),
      audios,
    };
  }

  // Genre search
  if (query.startsWith("g:")) {
    const foundAudios = await findAudiosByGenre(query.replace("g:", ""), 1000);
    const audios = (
      (await Promise.all(
        foundAudios.map(async (a) => getAudioById({ id: a.path_id, existingDbAudio: a }))
      )) as AudioWithMetadata[]
    ).filter(({ id }) => !!audioCollection[id]);

    const foundAlbums = audios.map((a) => ({ id: a.albumId }));
    const albums = (
      (await Promise.all(
        foundAlbums
          .filter(Boolean)
          // @ts-expect-error stfu
          .map(async (a) => getAlbumById(a.id || a.path_id))
      )) as AlbumWithFilesAndMetadata[]
    ).filter(({ name }) => name);

    // TODO: Add artists
    return {
      artists: [],
      albums: uniqBy(albums, ({ id }: { id: string }) => id),
      audios,
    };
  }

  // Term search
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

  const albums = (
    (await Promise.all(
      foundAlbums
        .filter(Boolean)
        .slice(0, limit * 2)
        // @ts-expect-error stfu
        .map(async (a) => getAlbumById(a.id || a.path_id))
    )) as AlbumWithFilesAndMetadata[]
  ).filter(({ name }) => name);

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

function lookupEntities<T>(entitiesForFind: T[], indices: number[]): T[] {
  const entities: (T | undefined)[] = [];

  for (const index of indices) {
    entities.push(entitiesForFind.at(index));
  }

  return entities.filter(Boolean) as T[];
}

export const findRandom = async ({
  limit = 6,
  lockedSearchTerm,
}: {
  limit?: number;
  lockedSearchTerm?: string;
}): Promise<FindResult> => {
  if (lockedSearchTerm) {
    lockedSearchTerm = lockedSearchTerm.trim();
    const query = parseInt(lockedSearchTerm, 10);

    // Year search
    if (!isNaN(query)) {
      const albumsInDb = await findAlbumsByYear(query, albumsForFind.length);
      const albumIndices = getRandomNumbers(albumsInDb.length, limit);
      const foundAlbums = lookupEntities<DbAlbum>(albumsInDb, albumIndices);
      const albums = await Promise.all(foundAlbums.map(async (a) => getAlbumById(a.path_id)));

      const audiosInDb = await findAudiosByYear(query, audiosForFind.length);
      const audioIndices = getRandomNumbers(audiosInDb.length, limit);
      const foundAudios = lookupEntities<DbAudio>(audiosInDb, audioIndices);
      const audios = (
        await Promise.all(foundAudios.map(async (a) => getAudioById({ id: a.path_id })))
      ).filter(({ id }) => !!audioCollection[id]);

      return {
        artists: [],
        albums,
        audios,
      } as FindResult;
    }

    // Genre search
    if (lockedSearchTerm.startsWith("g:")) {
      const audiosInDb = await findAudiosByGenre(lockedSearchTerm.replace("g:", ""), 1000);
      const audioIndices = getRandomNumbers(audiosInDb.length, limit);
      const foundAudios = lookupEntities<DbAudio>(audiosInDb, audioIndices);
      const audios = (
        await Promise.all(foundAudios.map(async (a) => getAudioById({ id: a.path_id })))
      ).filter(({ id }) => !!audioCollection[id]);

      const foundAlbums = audios.map((a) => ({ id: a.albumId || "" }));
      const albumIndices = getRandomNumbers(foundAlbums.length, limit);
      const albumsToFetch = lookupEntities<{ id: string }>(foundAlbums, albumIndices);
      const albums = await Promise.all(albumsToFetch.map(async (a) => getAlbumById(a.id)));

      // TODO: Add artists
      return {
        artists: [],
        // @ts-expect-error figure this out sometime
        albums: uniqBy(albums, ({ id }: { id: string }) => id),
        audios,
      } as unknown as FindResult;
    }

    // Random by locked search term
    const results = await find({ query: lockedSearchTerm, limit: 100 });

    const artistIndices = getRandomNumbers(results.artists.length, limit);
    const artists = lookupEntities<Artist>(results.artists, artistIndices);

    const albumIndices = getRandomNumbers(results.albums.length, limit);
    const foundAlbums = lookupEntities<AlbumWithFilesAndMetadata>(results.albums, albumIndices);
    const albums = await Promise.all(foundAlbums.map(async (a) => getAlbumById(a.id)));

    const audioIndices = getRandomNumbers(results.audios.length, limit);
    const foundAudios = lookupEntities<FileWithId>(results.audios, audioIndices);
    const audios = (
      await Promise.all(foundAudios.map(async (a) => getAudioById({ id: a.id })))
    ).filter(({ id }) => !!audioCollection[id]);

    return {
      artists,
      albums,
      audios,
    } as FindResult;
  }

  // Random
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
