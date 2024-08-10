import fuzzysort from "fuzzysort";
import uniqBy from "lodash.uniqby";
import path from "path";
import {
  findAlbumsByArtist,
  findAlbumsByMetadata,
  findAlbumsByYear,
  findAudiosByGenre,
  findAudiosByMetadataAndFilename,
  findAudiosByYear,
} from "../db";
import { DbAlbum, DbAudio, EnrichedAlbum, EnrichedAlbumFile } from "../db.types";
import { calculateOkapiBm25Score, tokenize } from "../fullTextSearch";
import {
  findAudioInCollectionById,
  getAlbumsForFind,
  getArtistsForFind,
  getAudiosForFind,
} from "../mediaCollection";
import { AlbumWithId, ArtistWithId, FileWithId } from "../scanner.types";
import UrlSafeBase64 from "../urlSafeBase64";
import { findAlbumById } from "./album";
import { AlbumWithFilesAndMetadata } from "./album.types";
import { getArtistAlbums } from "./artist";
import { ArtistWithEnrichedAlbums } from "./artist.types";
import { findAudioById } from "./audio";
import { AudioWithMetadata } from "./audio.types";
import { FindResult } from "./find.types";
import { normalizeSearchString } from "./find.utils";

const getAudios = (audios: (AudioWithMetadata | undefined)[]): AudioWithMetadata[] => {
  return audios
    .filter((audio) => !!audio)
    .filter((audio) => !!findAudioInCollectionById(audio.id));
};

const getAlbums = (
  albums: (AlbumWithFilesAndMetadata | undefined)[],
): AlbumWithFilesAndMetadata[] => {
  return albums.filter((album) => !!album).filter((album) => album.name);
};

export const find = async ({
  query,
  limit = 6,
}: {
  query: string;
  limit?: number;
}): Promise<FindResult> => {
  const isYearSearch = query.startsWith("year:");
  const isGenreSearch = query.startsWith("genre:");
  const isArtistSearch = query.startsWith("artist:");
  const isAlbumSearch = query.startsWith("album:");
  query = normalizeSearchString(query)
    .replace("artist:", "")
    .replace("album:", "")
    .replace("year:", "")
    .replace("genre:", "");

  if (query.length < 2) {
    return {
      artists: [],
      albums: [],
      audios: [],
    };
  }

  const albumsForFind = getAlbumsForFind();
  const artistsForFind = getArtistsForFind();

  if (isYearSearch) {
    const foundAlbums = await findAlbumsByYear(parseInt(query, 10), albumsForFind.length);
    const albums = getAlbums(
      await Promise.all(
        foundAlbums.filter(Boolean).map(async (a) => findAlbumById(a.id || a.path_id)),
      ),
    );

    const foundAudios = albums.map((a) => a.files).flat(Infinity) as EnrichedAlbumFile[];
    const audios = getAudios(
      await Promise.all(foundAudios.map(async (a) => findAudioById({ id: a.id }))),
    );

    // TODO: Add artists
    return {
      artists: [],
      albums: uniqBy(albums, ({ id }: { id: string }) => id),
      audios,
    };
  }

  if (isGenreSearch) {
    const foundAudios = await findAudiosByGenre(query, 1000);
    const audios = getAudios(
      await Promise.all(
        foundAudios.map(async (a) =>
          findAudioById({ id: a.path_id, existingDbAudio: a }),
        ),
      ),
    );

    const albums = getAlbums(
      await Promise.all(audios.map(async (a) => findAlbumById(a.albumId))),
    );

    // TODO: Add artists
    return {
      artists: [],
      albums: uniqBy(albums, ({ id }) => id),
      audios,
    };
  }

  // Term search
  const options = { limit, key: "searchName", threshold: -50 };
  const foundArtists = fuzzysort.go(query, artistsForFind, options);
  const artists = await Promise.all(
    foundArtists
      .map((a) => a.obj)
      .filter(Boolean)
      .map(async (a) => getArtistAlbums(a.id)),
  );
  const artist = artists.find(({ name }) => name.toLowerCase() === query);
  const artistAlbums = artist?.albums;
  const artistFiles = artist?.files;

  let albums: AlbumWithFilesAndMetadata[] = [];
  if (!isAlbumSearch && Array.isArray(artistAlbums) && artistAlbums.length) {
    albums = getAlbums(
      await Promise.all(
        artistAlbums
          .filter(Boolean)
          .slice(0, limit * 2)
          .map(async (a) => findAlbumById(a.id)),
      ),
    );
  }

  let audios: AudioWithMetadata[] = [];
  if (Array.isArray(artistFiles) && artistFiles.length) {
    audios = getAudios(
      await Promise.all(artistFiles.map(async (a) => findAudioById({ id: a.id }))),
    );
  }

  let foundAlbums: (DbAlbum | EnrichedAlbum)[] = [];

  if (!isArtistSearch) {
    foundAlbums = await findAlbumsByMetadata(query, limit);

    if (!isAlbumSearch && foundAlbums.length < limit && artists.length > 0) {
      artists.forEach((a) => {
        foundAlbums.push(...a.albums);
      });
    }

    /**
     * This is the case that an artist folder has multiple aliases inside of it
     */
    if (!isAlbumSearch && foundAlbums.length < limit) {
      const albumsByArtist = await findAlbumsByArtist(query, limit);
      albumsByArtist.forEach((a) => foundAlbums.push(a));

      if (albumsByArtist.length) {
        const firstAlbum = albumsByArtist[0];
        const pathId = firstAlbum.id || firstAlbum.path_id;

        if (pathId) {
          const artistFolder = UrlSafeBase64.decode(pathId).split(path.sep)[0];
          const artistId = UrlSafeBase64.encode(artistFolder);
          const artist = await getArtistAlbums(artistId);
          artists.push(artist);
        }
      }
    }
  }

  const restAlbums = getAlbums(
    await Promise.all(
      foundAlbums
        .filter(Boolean)
        .slice(0, limit * 2)
        .map(async (a) => findAlbumById(a.id || (a as DbAlbum).path_id)),
    ),
  );

  albums.push(...restAlbums);

  if (!isArtistSearch && !isAlbumSearch) {
    const foundAudios = await findAudiosByMetadataAndFilename(query, limit * 2);

    audios = getAudios(
      await Promise.all(
        foundAudios.map(async (a) =>
          findAudioById({ id: a.path_id, existingDbAudio: a }),
        ),
      ),
    );
  }

  if (isArtistSearch || audios.length < limit * 2) {
    albums.forEach((a) => audios.push(...a.files));
  }

  const k1 = 1.2;
  const b = 0.75;
  const terms = tokenize(query);
  const uniqAlbums = uniqBy(albums, ({ id }) => id);

  return {
    artists: uniqBy(artists, ({ name }) => name).sort(byOkapiBm25(terms, k1, b, true)),
    albums: uniqAlbums.sort(byOkapiBm25(terms, k1, b)),
    audios: uniqBy(audios, ({ id }) => id).sort(
      getAudioSortFn({
        isArtistSearch,
        isAlbumSearch,
        uniqAlbums,
        terms,
        k1,
        b,
      }),
    ),
  };
};

function getAudioSortFn({
  isArtistSearch,
  isAlbumSearch,
  uniqAlbums,
  terms,
  k1,
  b,
}: {
  isArtistSearch: boolean;
  isAlbumSearch: boolean;
  uniqAlbums: AlbumWithFilesAndMetadata[];
  terms: string[];
  k1: number;
  b: number;
}) {
  if (isArtistSearch || isAlbumSearch) {
    // Disable sorting when using artist or album search
    return () => 0;
  } else {
    return uniqAlbums.length > 1 ? byOkapiBm25(terms, k1, b) : byTrackAsc;
  }
}

function byTrackAsc(a: AudioWithMetadata, b: AudioWithMetadata) {
  const aTrack = `${a.metadata.track?.no}`.padStart(2, "0");
  const bTrack = `${b.metadata.track?.no}`.padStart(2, "0");
  const aDisk = a.metadata.disk?.no;
  const bDisk = b.metadata.disk?.no;
  const aTrackNo = aDisk ? Number(`${aDisk}.${aTrack}`) : Number(aTrack);
  const bTrackNo = bDisk ? Number(`${bDisk}.${bTrack}`) : Number(bTrack);

  return aTrackNo - bTrackNo;
}

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
  const albumsForFind = getAlbumsForFind();
  const artistsForFind = getArtistsForFind();
  const audiosForFind = getAudiosForFind();

  if (lockedSearchTerm) {
    lockedSearchTerm = lockedSearchTerm.trim();
    const query = parseInt(lockedSearchTerm, 10);

    // Year search
    if (!isNaN(query)) {
      const albumsInDb = await findAlbumsByYear(query, albumsForFind.length);
      const albumIndices = getRandomNumbers(albumsInDb.length, limit);
      const foundAlbums = lookupEntities<DbAlbum>(albumsInDb, albumIndices);
      const albums = getAlbums(
        await Promise.all(foundAlbums.map(async (a) => findAlbumById(a.path_id))),
      );

      const audiosInDb = await findAudiosByYear(query, audiosForFind.length);
      const audioIndices = getRandomNumbers(audiosInDb.length, limit);
      const foundAudios = lookupEntities<DbAudio>(audiosInDb, audioIndices);
      const audios = getAudios(
        await Promise.all(foundAudios.map(async (a) => findAudioById({ id: a.path_id }))),
      );

      return {
        artists: [],
        albums,
        audios,
      };
    }

    // Genre search
    if (lockedSearchTerm.startsWith("g:")) {
      const audiosInDb = await findAudiosByGenre(
        lockedSearchTerm.replace("g:", ""),
        1000,
      );
      const audioIndices = getRandomNumbers(audiosInDb.length, limit);
      const foundAudios = lookupEntities<DbAudio>(audiosInDb, audioIndices);
      const audios = getAudios(
        await Promise.all(foundAudios.map(async (a) => findAudioById({ id: a.path_id }))),
      );

      const foundAlbums = audios.map((a) => ({ id: a.albumId || "" }));
      const albumIndices = getRandomNumbers(foundAlbums.length, limit);
      const albumsToFetch = lookupEntities<{ id: string }>(foundAlbums, albumIndices);
      const albums = getAlbums(
        await Promise.all(albumsToFetch.map(async (a) => findAlbumById(a.id))),
      );

      // TODO: Add artists
      return {
        artists: [],
        albums: uniqBy(albums, ({ id }: { id: string }) => id),
        audios,
      };
    }

    // Random by locked search term
    const results = await find({ query: lockedSearchTerm, limit: 100 });

    const artistIndices = getRandomNumbers(results.artists.length, limit);
    const artists = lookupEntities<ArtistWithEnrichedAlbums>(
      results.artists,
      artistIndices,
    );

    const albumIndices = getRandomNumbers(results.albums.length, limit);
    const foundAlbums = lookupEntities<AlbumWithFilesAndMetadata>(
      results.albums,
      albumIndices,
    );
    const albums = getAlbums(
      await Promise.all(foundAlbums.map(async (a) => findAlbumById(a.id))),
    );

    const audioIndices = getRandomNumbers(results.audios.length, limit);
    const foundAudios = lookupEntities<AudioWithMetadata>(results.audios, audioIndices);
    const audios = getAudios(
      await Promise.all(foundAudios.map(async (a) => findAudioById({ id: a.id }))),
    );

    return {
      artists,
      albums,
      audios,
    };
  }

  // Random
  const artistIndices = getRandomNumbers(artistsForFind.length, limit);
  const foundArtists = lookupEntities<ArtistWithId>(artistsForFind, artistIndices);
  const artists = await Promise.all(foundArtists.map(async (a) => getArtistAlbums(a.id)));

  const albumIndices = getRandomNumbers(albumsForFind.length, limit);
  const foundAlbums = lookupEntities<AlbumWithId>(albumsForFind, albumIndices);
  const albums = getAlbums(
    await Promise.all(foundAlbums.map(async (a) => findAlbumById(a.id))),
  );

  const audioIndices = getRandomNumbers(audiosForFind.length, limit);
  const foundAudios = lookupEntities<FileWithId>(audiosForFind, audioIndices);
  const audios = getAudios(
    await Promise.all(foundAudios.map(async (a) => findAudioById({ id: a.id }))),
  );

  return {
    artists,
    albums,
    audios,
  };
};
