import path from "path";
import fs from "fs/promises";
import Datastore from "@seald-io/nedb";

import UrlSafeBase64 from "./urlsafe-base64";
import { getMetadata } from "./metadata";

import { AlbumCollection, AlbumWithFiles, ArtistWithAlbums } from "./media-separator.types";
import { Metadata } from "./metadata.types";
import {
  DbAudio,
  DbAlbum,
  DbTheme,
  AlbumUpsertOptions,
  EnrichedAlbum,
  EnrichedAlbumFile,
} from "./db.types";

const { NODE_ENV } = process.env;
const isDev = NODE_ENV === "local";

let audioDb: Datastore<DbAudio>;
let albumDb: Datastore<DbAlbum>;
let themeDb: Datastore<DbTheme>;
let libPath: string;

export const initDb = async (libraryPath: string) => {
  libPath = libraryPath;

  const audioDbFile = `${isDev ? ".dev" : ""}.musa.audio.v1.db`;
  audioDb = new Datastore<DbAudio>({
    filename: path.join(libraryPath, audioDbFile),
  });
  await audioDb.loadDatabaseAsync();

  const albumDbFile = `${isDev ? ".dev" : ""}.musa.album.v1.db`;
  albumDb = new Datastore<DbAlbum>({
    filename: path.join(libraryPath, albumDbFile),
  });
  await albumDb.loadDatabaseAsync();

  const themeDbFile = `${isDev ? ".dev" : ""}.musa.theme.v2.db`;
  themeDb = new Datastore<DbTheme>({
    filename: path.join(libraryPath, themeDbFile),
  });
  await themeDb.loadDatabaseAsync();
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

export const insertAudio = async (file: { id: string; filename: string }): Promise<void> => {
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

export const upsertAudio = async (file: {
  id: string;
  filename: string;
  quiet: boolean;
}): Promise<void> => {
  const { id, filename, quiet = false } = file;

  if (!id || !filename) {
    return;
  }

  const filepath = path.join(libPath, UrlSafeBase64.decode(id));
  const stats = await fs.stat(filepath);
  const modifiedAt = new Date(stats.mtimeMs);
  const dbAudio = await getAudio(id);

  if (!dbAudio) {
    const metadata = await getMetadata(libPath, { id, quiet });

    console.log("Inserting audio", id);
    await audioDb.insertAsync({
      path_id: id,
      modified_at: new Date().toISOString(),
      filename,
      metadata,
    });
  } else if (modifiedAt.getTime() > new Date(dbAudio.modified_at).getTime()) {
    const metadata = await getMetadata(libPath, { id, quiet });

    console.log("Updating audio", filename, "because it was modified at", modifiedAt);
    await audioDb.updateAsync(
      { path_id: id },
      {
        $set: {
          modified_at: modifiedAt.toISOString(),
          filename,
          metadata,
        },
      }
    );
  }
};

export const getAudio = async (id: string): Promise<DbAudio> => {
  return audioDb.findOneAsync({ path_id: id });
};

export const getAllAudios = async (): Promise<DbAudio[]> => {
  return audioDb.findAsync({});
};

export const getAudiosByIds = async (ids: string[]): Promise<DbAudio[]> => {
  return audioDb.findAsync({ path_id: { $in: ids } });
};

export const findAudios = async (
  limit: number,
  comparatorFn: (self: DbAudio) => boolean
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
  limit: number
): Promise<DbAudio[]> => {
  const audiosByExactTitle = await findAudios(limit, (self: DbAudio) => {
    const title = (self?.metadata?.title || "").toLowerCase();
    const queryLc = query.toLowerCase();

    return title === queryLc;
  });

  let audiosByFuzzyTitle: DbAudio[] = [];
  let amountOfAudios = audiosByExactTitle.length;

  if (amountOfAudios < limit) {
    audiosByFuzzyTitle = await findAudios(limit - amountOfAudios, (self: DbAudio) => {
      const title = (self?.metadata?.title || "").toLowerCase();
      const queryLc = query.toLowerCase();

      return title.includes(queryLc);
    });
  }

  let audiosByExactFilename: DbAudio[] = [];
  amountOfAudios += audiosByFuzzyTitle.length;

  if (amountOfAudios < limit) {
    audiosByExactFilename = await findAudios(limit - amountOfAudios, (self: DbAudio) => {
      const filename = (self?.filename || "").toLowerCase();
      const queryLc = query.toLowerCase();

      return filename === queryLc;
    });
  }

  let audiosByFuzzyFilename: DbAudio[] = [];
  amountOfAudios += audiosByExactFilename.length;

  if (amountOfAudios < limit) {
    audiosByFuzzyFilename = await findAudios(limit - amountOfAudios, (self: DbAudio) => {
      const filename = (self?.filename || "").toLowerCase();
      const queryLc = query.toLowerCase();

      return filename.includes(queryLc);
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

export const upsertAlbum = async (file: AlbumUpsertOptions): Promise<void> => {
  if (!file) {
    return;
  }
  const { id, album } = file;
  const albumAudioIds = album.files.map(({ id }) => id);
  const dbAlbum = await getAlbum(id);
  const dbAlbumAudios = await getAudiosByIds(albumAudioIds);
  const modifiedAts = dbAlbumAudios.map(({ modified_at }) => new Date(modified_at).getTime());
  const lastModificationTime = Math.max(...modifiedAts);
  const dbAlbumAudio = dbAlbumAudios[0];

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

  if (!dbAlbum) {
    await albumDb.insertAsync(albumToUpsert);
  } else if (new Date(dbAlbum.modified_at).getTime() < lastModificationTime) {
    console.log(
      "Updating album",
      album.name,
      "because it was modified at",
      new Date(lastModificationTime).toISOString()
    );
    await albumDb.updateAsync({ path_id: id }, albumToUpsert);
  }
};

const buildAlbumMetadata = (metadata: Metadata) => {
  const { year, album, artists, artist, albumArtist, genre, dynamicRangeAlbum } = metadata;
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

export const enrichAlbums = async (
  albumCollection: AlbumCollection,
  artist: ArtistWithAlbums
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
    })
  );
};

export const enrichAlbumFiles = async (album: AlbumWithFiles): Promise<EnrichedAlbumFile[]> => {
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
      };
    })
  );

  mergedFiles.sort((a, b) => a.track.localeCompare(b.track));

  return mergedFiles;
};

export const getAllThemes = async (): Promise<DbTheme[]> => {
  return themeDb.findAsync({});
};

export const getTheme = async (id: string): Promise<DbTheme | undefined> => {
  return themeDb.findOneAsync({ path_id: id });
};

export const insertTheme = async (id: string, colors: unknown): Promise<DbTheme> => {
  return themeDb.insertAsync({
    _id: id,
    path_id: id,
    modified_at: new Date().toISOString(),
    filename: UrlSafeBase64.decode(id),
    colors,
  });
};

export const removeTheme = async (id: string): Promise<number> => {
  return themeDb.removeAsync({ _id: id }, {});
};
