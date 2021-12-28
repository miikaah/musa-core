import path from "path";
import fs from "fs/promises";
import Datastore from "@seald-io/nedb";
import { getMetadata, Metadata } from "./metadata";
import { UrlSafeBase64, AlbumCollection, AlbumWithFiles, ArtistWithAlbums } from "./";

const { NODE_ENV } = process.env;
const isDev = NODE_ENV === "local";

export type DbAudio = {
  path_id: string;
  modified_at: string;
  filename: string;
  metadata: Metadata;
};
export type DbAlbum = { path_id: string; modified_at: string; metadata: Metadata };
export type DbTheme = { colors: unknown; filename: string; path_id: string };

let audioDb: Datastore<DbAudio>;
let albumDb: Datastore<DbAlbum>;
let themeDb: Datastore<DbTheme>;
let libPath: string;
export const initDb = (libraryPath: string): void => {
  libPath = libraryPath;

  const audioDbFile = `${isDev ? ".dev" : ""}.musa.audio.v1.db`;
  audioDb = new Datastore<DbAudio>({
    filename: path.join(libraryPath, audioDbFile),
  });
  audioDb.loadDatabase();

  const albumDbFile = `${isDev ? ".dev" : ""}.musa.album.v1.db`;
  albumDb = new Datastore({
    filename: path.join(libraryPath, albumDbFile),
  });
  albumDb.loadDatabase();

  const themeDbFile = `${isDev ? ".dev" : ""}.musa.theme.v2.db`;
  themeDb = new Datastore({
    filename: path.join(libraryPath, themeDbFile),
  });
  themeDb.loadDatabase();
};

export const insertAudio = async (file: { id: string; filename: string }): Promise<void> => {
  if (!file) {
    return;
  }
  const { id, filename } = file;
  const metadata = await getMetadata(libPath, { id, quiet: true });

  audioDb.insert({
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
    audioDb.insert({
      path_id: id,
      modified_at: new Date().toISOString(),
      filename,
      metadata,
    });
  } else if (modifiedAt.getTime() > new Date(dbAudio.modified_at).getTime()) {
    const metadata = await getMetadata(libPath, { id, quiet });

    console.log("Updating audio", filename, "because it was modified at", modifiedAt);
    audioDb.update(
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

type AlbumUpsertOptions = {
  id: string;
  album: {
    name: string;
    files: { id: string }[];
  };
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
  if (!dbAlbum) {
    albumDb.insert({
      path_id: id,
      modified_at: new Date().toISOString(),
      filename: album.name,
      metadata,
    });
  } else if (new Date(dbAlbum.modified_at).getTime() < lastModificationTime) {
    console.log(
      "Updating album",
      album.name,
      "because it was modified at",
      new Date(lastModificationTime).toISOString()
    );
    albumDb.update(
      { path_id: id },
      {
        modified_at: new Date().toISOString(),
        filename: album.name,
        metadata,
      }
    );
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

export const getAudio = async (id: string): Promise<DbAudio> => {
  return new Promise((resolve, reject) => {
    audioDb.findOne({ path_id: id }, (err, audio) => {
      if (err) {
        reject(err);
      } else {
        resolve(audio);
      }
    });
  });
};

export const getAllAudios = async (): Promise<DbAudio[]> => {
  return new Promise((resolve, reject) => {
    audioDb.find({}, (err: unknown, audios: DbAudio[]) => {
      if (err) {
        reject(err);
      } else {
        resolve(audios);
      }
    });
  });
};

export const getAudiosByIds = async (ids: string[]): Promise<DbAudio[]> => {
  return new Promise((resolve, reject) => {
    audioDb.find({ path_id: { $in: ids } }, (err: unknown, audios: DbAudio[]) => {
      if (err) {
        reject(err);
      } else {
        resolve(audios);
      }
    });
  });
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

export const getAlbum = async (id: string): Promise<DbAlbum> => {
  return new Promise((resolve, reject) => {
    albumDb.findOne({ path_id: id }, (err, album) => {
      if (err) {
        reject(err);
      } else {
        resolve(album);
      }
    });
  });
};

export type EnrichedAlbum = {
  id: string;
  name: string;
  url: string;
  coverUrl?: string;
  year?: number | null;
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

export type EnrichedAlbumFile = {
  id?: string;
  name: string;
  track: string;
  fileUrl?: string;
  metadata?: Metadata;
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
        id: file?.path_id,
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
  return new Promise((resolve, reject) => {
    themeDb.find({}, (err: unknown, themes: DbTheme[]) => {
      if (err) {
        reject(err);
      } else {
        resolve(themes);
      }
    });
  });
};

export const getTheme = async (id: string): Promise<DbTheme> => {
  return new Promise((resolve, reject) => {
    themeDb.findOne({ path_id: id }, (err, theme) => {
      if (err) {
        reject(err);
      } else {
        resolve(theme);
      }
    });
  });
};

export const insertTheme = async (id: string, colors: unknown): Promise<DbTheme> => {
  const filename = UrlSafeBase64.decode(id);

  return new Promise((resolve, reject) => {
    themeDb.insert(
      {
        _id: id,
        path_id: id,
        modified_at: new Date().toISOString(),
        filename,
        colors,
      },
      (err, newTheme) => {
        if (err) {
          reject(err);
        } else {
          resolve(newTheme);
        }
      }
    );
  });
};

export const removeTheme = async (id: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    themeDb.remove(
      {
        _id: id,
      },
      (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      }
    );
  });
};
