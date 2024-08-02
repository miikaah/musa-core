import Datastore from "@seald-io/nedb";
import fs from "fs/promises";
import path from "path";
import { musadir } from "./config";
import {
  AlbumUpsertOptions,
  Colors,
  DbAlbum,
  DbAudio,
  DbExternalAudio,
  DbPlaylist,
  DbTheme,
  EnrichedAlbum,
  EnrichedAlbumFile,
} from "./db.types";
import { generateRandomString } from "./generateRandomString";
import {
  AlbumCollection,
  AlbumWithFiles,
  ArtistWithAlbums,
} from "./mediaSeparator.types";
import { getMetadata } from "./metadata";
import { Metadata } from "./metadata.types";
import UrlSafeBase64 from "./urlSafeBase64";

const { NODE_ENV } = process.env;
const isDev = NODE_ENV === "local";
const devTagToPrepend = ".dev";

let audioDb: Datastore<DbAudio>;
let albumDb: Datastore<DbAlbum>;
let themeDb: Datastore<DbTheme>;
let playlistDb: Datastore<DbPlaylist>;
let externalAudioDb: Datastore<DbExternalAudio>;
let libPath: string;

export const initDb = async (libraryPath: string) => {
  libPath = libraryPath;

  try {
    await fs.access(musadir, fs.constants.F_OK);
  } catch (e: any) {
    if (e.code === "ENOENT") {
      try {
        console.log("Musadir does not exist. Attempting to create it.");
        await fs.mkdir(musadir);
      } catch (e) {
        console.error("Failed to create musadir", e);
      }
    } else {
      console.log("The musadir fs.access call threw", e);
    }
  }

  const dbDir = NODE_ENV === "test" ? libraryPath : musadir;

  const audioDbFile = `${isDev ? devTagToPrepend : ""}.musa.audio.v2.db`;
  audioDb = new Datastore<DbAudio>({
    filename: path.join(dbDir, audioDbFile),
  });
  await audioDb.loadDatabaseAsync();

  const albumDbFile = `${isDev ? devTagToPrepend : ""}.musa.album.v1.db`;
  albumDb = new Datastore<DbAlbum>({
    filename: path.join(dbDir, albumDbFile),
  });
  await albumDb.loadDatabaseAsync();

  const themeDbFile = `${isDev ? devTagToPrepend : ""}.musa.theme.v2.db`;
  themeDb = new Datastore<DbTheme>({
    filename: path.join(dbDir, themeDbFile),
  });
  await themeDb.loadDatabaseAsync();

  const playlistDbFile = `${isDev ? devTagToPrepend : ""}.musa.playlist.v1.db`;
  playlistDb = new Datastore<DbTheme>({
    filename: path.join(dbDir, playlistDbFile),
  });
  await playlistDb.loadDatabaseAsync();

  const externalAudioDbFile = `${isDev ? devTagToPrepend : ""}.musa.external-audio.v1.db`;
  externalAudioDb = new Datastore<DbExternalAudio>({
    filename: path.join(dbDir, externalAudioDbFile),
  });
  await externalAudioDb.loadDatabaseAsync();
};

export const initTestDb = async (libraryPath: string) => {
  libPath = libraryPath;

  audioDb = new Datastore<DbAudio>();
  await audioDb.loadDatabaseAsync();
  albumDb = new Datastore<DbAlbum>();
  await albumDb.loadDatabaseAsync();
  themeDb = new Datastore<DbTheme>();
  await themeDb.loadDatabaseAsync();

  return { audioDb, albumDb, themeDb };
};

export const insertAudio = async (file: {
  id: string;
  filename: string;
}): Promise<void> => {
  if (!file) {
    return;
  }
  const { id, filename } = file;
  const metadata = await getMetadata(libPath, { id, quiet: true });

  await audioDb.insertAsync({
    path_id: id,
    modified_at: new Date().toISOString(),
    filename,
    metadata,
  });
};

export const insertExternalAudio = async (file: {
  id: string;
  filename: string;
  filepath: string;
  metadata: Metadata;
}): Promise<void> => {
  const { id, filename, metadata, filepath } = file;

  await externalAudioDb.insertAsync({
    path_id: id,
    modified_at: new Date().toISOString(),
    filename,
    filepath,
    metadata,
  });
};

export const updateAudio = async (file: {
  id: string;
  filename: string;
  modifiedAt: Date;
}): Promise<void> => {
  if (!file) {
    return;
  }

  const { id, filename, modifiedAt } = file;
  const metadata = await getMetadata(libPath, { id, quiet: true });

  console.log(
    `Updating audio ${filename} because it was modified at ${modifiedAt.toISOString()}`,
  );
  await audioDb.updateAsync(
    { path_id: id },
    {
      $set: {
        modified_at: modifiedAt.toISOString(),
        filename,
        metadata,
      },
    },
  );
};

export const updateExternalAudio = async (file: {
  id: string;
  filename: string;
  metadata: Metadata;
  modifiedAt: Date;
}): Promise<void> => {
  const { id, filename, modifiedAt, metadata } = file;

  console.log(
    `Updating external audio ${filename} because it was modified at ${modifiedAt.toISOString()}`,
  );
  await externalAudioDb.updateAsync(
    { path_id: id },
    {
      $set: {
        modified_at: modifiedAt.toISOString(),
        filename,
        metadata,
      },
    },
  );
};

export const getAudio = async (id: string): Promise<DbAudio> => {
  return audioDb.findOneAsync({ path_id: id });
};

export const getExternalAudio = async (id: string): Promise<DbAudio> => {
  return externalAudioDb.findOneAsync({ path_id: id });
};

export const getAllAudios = async (): Promise<DbAudio[]> => {
  return audioDb.findAsync({});
};

export const getAudiosByIds = async (ids: string[]): Promise<DbAudio[]> => {
  return audioDb.findAsync({ path_id: { $in: ids } });
};

export const findAudios = async (
  limit: number,
  comparatorFn: (self: DbAudio) => boolean,
): Promise<DbAudio[]> => {
  return new Promise((resolve, reject) => {
    audioDb
      .find({
        $where: function () {
          return comparatorFn(this);
        },
      })
      .limit(limit)
      .exec((err: unknown, audios: DbAudio[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(audios);
        }
      });
  });
};

export const findAudiosByMetadataAndFilename = async (
  query: string,
  limit: number,
): Promise<DbAudio[]> => {
  const audiosByExactTitle = await findAudios(limit, (self: DbAudio) => {
    const title = self?.metadata?.title || "";

    return title.toLowerCase() === query.toLowerCase();
  });

  let audiosByFuzzyTitle: DbAudio[] = [];
  let amountOfAudios = audiosByExactTitle.length;

  if (amountOfAudios < limit) {
    audiosByFuzzyTitle = await findAudios(limit - amountOfAudios, (self: DbAudio) => {
      const title = self?.metadata?.title || "";

      return title.toLowerCase().includes(query.toLowerCase());
    });
  }

  let audiosByExactFilename: DbAudio[] = [];
  amountOfAudios += audiosByFuzzyTitle.length;

  if (amountOfAudios < limit) {
    audiosByExactFilename = await findAudios(limit - amountOfAudios, (self: DbAudio) => {
      const filename = self?.filename || "";

      return filename.toLowerCase() === query.toLowerCase();
    });
  }

  let audiosByFuzzyFilename: DbAudio[] = [];
  amountOfAudios += audiosByExactFilename.length;

  if (amountOfAudios < limit) {
    audiosByFuzzyFilename = await findAudios(limit - amountOfAudios, (self: DbAudio) => {
      const filename = self?.filename || "";

      return filename.toLowerCase().includes(query.toLowerCase());
    });
  }

  const foundAudios = new Map();
  [
    ...audiosByExactTitle,
    ...audiosByFuzzyTitle,
    ...audiosByExactFilename,
    ...audiosByFuzzyFilename,
  ].forEach((a) => foundAudios.set(a.path_id, a));

  return Array.from(foundAudios.values());
};

export const findAudiosByYear = async (
  query: number,
  limit: number,
): Promise<DbAudio[]> => {
  const audios = await findAudios(limit, (self: DbAudio) => {
    const year = self?.metadata?.year || "";

    return year === query;
  });

  const foundAudios = new Map();
  audios.forEach((a) => foundAudios.set(a.path_id, a));

  return Array.from(foundAudios.values());
};

export const findAudiosByGenre = async (
  query: string,
  limit: number,
): Promise<DbAudio[]> => {
  const audios = await findAudios(limit, (self: DbAudio) => {
    const genres = self?.metadata?.genre || [];

    return genres.some((genre) => genre.toLowerCase() === query.toLowerCase());
  });

  const foundAudios = new Map();
  audios.forEach((a) => foundAudios.set(a.path_id, a));

  return Array.from(foundAudios.values());
};

export const findAlbums = async (
  limit: number,
  comparatorFn: (self: DbAlbum) => boolean,
): Promise<DbAlbum[]> => {
  return new Promise((resolve, reject) => {
    albumDb
      .find({
        $where: function () {
          return comparatorFn(this);
        },
      })
      .limit(limit)
      .exec((err: unknown, albums: DbAlbum[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(albums);
        }
      });
  });
};

export const findAlbumsByMetadata = async (
  query: string,
  limit: number,
): Promise<DbAlbum[]> => {
  const albumsByExactTitle = await findAlbums(limit, (self: DbAlbum) => {
    const title = self?.metadata?.album || "";

    return title.toLowerCase() === query.toLowerCase();
  });

  let albumsByFuzzyTitle: DbAlbum[] = [];
  const amountOfAudios = albumsByExactTitle.length;

  if (amountOfAudios < limit) {
    albumsByFuzzyTitle = await findAlbums(limit - amountOfAudios, (self: DbAlbum) => {
      const title = self?.metadata?.album || "";

      return title.toLowerCase().includes(query.toLowerCase());
    });
  }

  const foundAlbums = new Map();
  [...albumsByExactTitle, ...albumsByFuzzyTitle].forEach((a) =>
    foundAlbums.set(a.path_id, a),
  );

  return Array.from(foundAlbums.values());
};

export const findAlbumsByArtist = async (
  query: string,
  limit: number,
): Promise<DbAlbum[]> => {
  const albums = await findAlbums(limit, (self: DbAlbum) => {
    const artist = self?.metadata?.artist || "";

    return artist.toLowerCase().includes(query.toLowerCase());
  });

  const foundAlbums = new Map();
  albums.forEach((a) => foundAlbums.set(a.path_id, a));

  return Array.from(foundAlbums.values());
};

export const findAlbumsByYear = async (
  query: number,
  limit: number,
): Promise<DbAlbum[]> => {
  const albums = await findAlbums(limit, (self: DbAlbum) => {
    const year = self?.metadata?.year || 0;

    return year === query;
  });

  const foundAlbums = new Map();
  albums.forEach((a) => foundAlbums.set(a.path_id, a));

  return Array.from(foundAlbums.values());
};

export const upsertAlbum = async (file: AlbumUpsertOptions): Promise<void> => {
  if (!file) {
    return;
  }
  const { id, album } = file;
  const dbAlbumAudio = await getAudio(album.files[0].id);

  if (!dbAlbumAudio) {
    return;
  }

  const metadata = buildAlbumMetadata(dbAlbumAudio.metadata);
  const albumToUpsert = {
    path_id: id,
    modified_at: new Date().toISOString(),
    filename: album.name,
    metadata,
  };

  await albumDb.updateAsync({ path_id: id }, albumToUpsert, { upsert: true });
};

const buildAlbumMetadata = (metadata: Metadata) => {
  const { year, album, artists, artist, albumArtist, genre, dynamicRangeAlbum } =
    metadata;
  return {
    year,
    album,
    artists,
    artist,
    albumArtist,
    genre,
    dynamicRangeAlbum,
  };
};

export const getAlbum = async (id: string): Promise<DbAlbum> => {
  return albumDb.findOneAsync({ path_id: id });
};

export const getAlbums = async (): Promise<DbAlbum[]> => {
  return albumDb.findAsync({});
};

export const enrichAlbums = async (
  albumCollection: AlbumCollection,
  artist: ArtistWithAlbums,
): Promise<EnrichedAlbum[]> => {
  return Promise.all(
    artist.albums.map(async ({ id, name, url, coverUrl, firstAlbumAudio }) => {
      let year = null;
      let albumName = null;

      if (firstAlbumAudio && firstAlbumAudio.id) {
        const audio = await getAudio(firstAlbumAudio.id);

        year = audio?.metadata?.year;
        albumName = audio?.metadata?.album;
      }

      const files = await enrichAlbumFiles(albumCollection[id]);

      return {
        id,
        name: albumName || name,
        url,
        coverUrl,
        year,
        files,
      };
    }),
  );
};

export const enrichAlbumFiles = async (
  album: AlbumWithFiles,
): Promise<EnrichedAlbumFile[]> => {
  const audioIds = album.files.map(({ id }) => id);
  const files = await getAudiosByIds(audioIds);
  const trackNumbers = files.map((file) => Number(file?.metadata?.track?.no));
  const maxTrackNo = Math.max(...trackNumbers);
  const pad = `${maxTrackNo}`.length;
  const padLen = pad < 2 ? 2 : pad;

  const mergedFiles = await Promise.all(
    album.files.map(async ({ id, name: filename, url, fileUrl }) => {
      const file = files.find((f) => f.path_id === id);
      const name = file?.metadata?.title || filename;
      const trackNo = `${file?.metadata?.track?.no || ""}`;
      const diskNo = `${file?.metadata?.disk?.no || ""}`;
      const track = `${diskNo ? `${diskNo}.` : ""}${trackNo.padStart(padLen, "0")}`;

      return {
        id: file?.path_id || "",
        name,
        track,
        url,
        fileUrl,
        metadata: file?.metadata,
        coverUrl: album.coverUrl,
      };
    }),
  );

  mergedFiles.sort((a, b) => a.track.localeCompare(b.track));

  return mergedFiles;
};

export const getAllThemes = async (): Promise<DbTheme[]> => {
  const themes = await themeDb.findAsync({});

  return themes.sort((a: DbTheme, b: DbTheme) => a.filename.localeCompare(b.filename));
};

export const getTheme = async (id: string): Promise<DbTheme | undefined> => {
  return themeDb.findOneAsync({ path_id: id });
};

export const insertTheme = async (id: string, colors: Colors): Promise<DbTheme> => {
  return themeDb.insertAsync({
    _id: id,
    path_id: id,
    modified_at: new Date().toISOString(),
    filename: UrlSafeBase64.decode(id),
    colors,
  });
};

export const updateTheme = async (id: string, colors: Colors): Promise<DbTheme> => {
  const { affectedDocuments } = await themeDb.updateAsync(
    { path_id: id },
    {
      $set: {
        modified_at: new Date().toISOString(),
        filename: UrlSafeBase64.decode(id),
        colors,
      },
    },
    {
      returnUpdatedDocs: true,
    },
  );

  if (!affectedDocuments) {
    throw new Error("Theme not found");
  }

  if (!Array.isArray(affectedDocuments)) {
    return affectedDocuments;
  }

  return affectedDocuments[0];
};

export const removeTheme = async (id: string): Promise<number> => {
  return themeDb.removeAsync({ _id: id }, {});
};

export const getAllGenres = async (): Promise<string[]> => {
  const genresInDb = (await audioDb.findAsync({}))
    .map((a: DbAudio) => a.metadata.genre)
    .flat(Infinity) as string[];
  const processedGenres = genresInDb.filter(Boolean).map(capitalize);

  return [...new Set(processedGenres)].sort((a, b) => a.localeCompare(b));
};

const capitalize = (str: string) => {
  if (!str) {
    return str;
  }

  return str.split(" ").map(capitalizeToken).join(" ");
};

const capitalizeToken = (str: string) => {
  if (!str) {
    return str;
  }

  return `${str[0].toUpperCase()}${str.substring(1, str.length)}`;
};

export const insertPlaylist = async ({
  pathIds,
  createdByUserId,
}: {
  pathIds: string[];
  createdByUserId: string;
}): Promise<DbPlaylist> => {
  let id = generateRandomString(6);
  let playlist = await getPlaylist(id);

  for (let i = 1; playlist; i++) {
    id = generateRandomString(6 + i);
    playlist = await getPlaylist(id);
  }

  return playlistDb.insertAsync({
    _id: id,
    playlist_id: id,
    modified_at: new Date().toISOString(),
    path_ids: pathIds,
    created_by_user_id: createdByUserId,
  });
};

export const getPlaylist = async (id: string): Promise<DbPlaylist | undefined> => {
  return playlistDb.findOneAsync({ playlist_id: id });
};
