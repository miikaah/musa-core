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
import { tokenize } from "../fullTextSearch";
import {
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
import {
  byOkapiBm25,
  getAlbums,
  getAlbumSortFn,
  getAudios,
  getAudioSortFn,
  getRandomNumber,
  getRandomNumbers,
  lookupEntities,
  normalizeSearchString,
} from "./find.utils";

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
  query = normalizeSearchString(
    query
      .replace("artist:", "")
      .replace("album:", "")
      .replace("year:", "")
      .replace("genre:", ""),
  );

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
  const exactArtist = artists.find(({ searchName }) => searchName.includes(query));
  const exactArtistAlbums = exactArtist?.albums;
  const exactArtistFiles = exactArtist?.files;

  let albums: AlbumWithFilesAndMetadata[] = [];
  if (!isAlbumSearch && Array.isArray(exactArtistAlbums) && exactArtistAlbums.length) {
    albums = getAlbums(
      await Promise.all(
        exactArtistAlbums
          .filter(Boolean)
          .slice(0, limit * 2)
          .map(async (a) => findAlbumById(a.id)),
      ),
    );
  }

  let audios: AudioWithMetadata[] = [];
  if (Array.isArray(exactArtistFiles) && exactArtistFiles.length) {
    audios = getAudios(
      await Promise.all(exactArtistFiles.map(async (a) => findAudioById({ id: a.id }))),
    );
  }

  let foundAlbums: (DbAlbum | EnrichedAlbum)[] = [];

  if (!isArtistSearch) {
    foundAlbums = await findAlbumsByMetadata(query, limit);

    if (!isAlbumSearch && foundAlbums.length < limit && artists.length > 0) {
      artists.forEach((a) => {
        if (exactArtist) {
          foundAlbums.push(...a.albums);
        } else if (a.albums.length) {
          const randomAlbum = a.albums[getRandomNumber(a.albums.length - 1)];
          foundAlbums.push(randomAlbum);
        }
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

  if (isArtistSearch || isAlbumSearch) {
    albums.forEach((a) => audios.push(...a.files));
  }

  const k1 = 1.2;
  const b = 0.75;
  const terms = tokenize(query);
  const uniqAlbumArtists = uniqBy(albums, ({ artistName }) => artistName).map(
    ({ artistName }) => artistName,
  );
  const uniqAlbums = uniqBy(albums, ({ id }) => id);

  // NOTE: Scanning needs to be enabled for fulltext search to be enabled
  return {
    artists: uniqBy(artists, ({ name }) => name).sort(byOkapiBm25(terms, k1, b, true)),
    albums: uniqAlbums.sort(
      getAlbumSortFn({
        isArtistSearch,
        isAlbumSearch,
        uniqAlbumArtists,
        terms,
        k1,
        b,
      }),
    ),
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
