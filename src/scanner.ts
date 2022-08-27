import path from "path";
import fs from "fs/promises";

import { traverseFileSystem, audioExts } from "./fs";
import { createMediaCollection } from "./media-separator";
import UrlSafeBase64 from "./urlsafe-base64";
import * as Db from "./db";
import { tokenize, updateTf, updateParams } from "./full-text-search";

import { AlbumUpsertOptions } from "./db.types";
import {
  ArtistsForFind,
  AlbumsForFind,
  AudiosForFind,
  IpcMainEvent,
  MediaCollectionAndFiles,
} from "./scanner.types";
import {
  ArtistCollection,
  AlbumCollection,
  FileCollection,
  ArtistObject,
} from "./media-separator.types";

const { DISABLE_SCANNING } = process.env;
const isScanningDisabled = DISABLE_SCANNING === "true";

const logOpStart = (title: string) => {
  console.log(title);
  console.log("----------------------");
};

const logOpReport = (start: number, collection: unknown[], name: string) => {
  console.log(`Took: ${(Date.now() - start) / 1000} seconds`);
  console.log(`Found: ${collection.length} ${name}`);
  console.log("----------------------\n");
};

export let files: string[] = [];
export let artistCollection: ArtistCollection = {};
export let albumCollection: AlbumCollection = {};
export let audioCollection: FileCollection = {};
export let imageCollection: FileCollection = {};
export let artistObject: ArtistObject;

export let artistsForFind: ArtistsForFind = [];
export let albumsForFind: AlbumsForFind = [];
export let audiosForFind: AudiosForFind = [];

let cachedElectronFileProtocol = "";

type ScanProgressListener = (
  ratio: number,
  mode: "none" | "normal" | "indeterminate" | "error" | "paused"
) => void;

let scanProgressListener: ScanProgressListener;

export const setScanProgressListener = (callback: ScanProgressListener) => {
  scanProgressListener = callback;
};

export const refresh = async ({
  musicLibraryPath,
  baseUrl,
  isElectron = false,
  event,
  scanColor,
}: {
  musicLibraryPath: string;
  baseUrl?: string;
  isElectron?: boolean;
  event?: IpcMainEvent;
  scanColor?: { INSERT: string; UPDATE: string; ALBUM_UPDATE: string };
}): Promise<void> => {
  if (isElectron && !cachedElectronFileProtocol) {
    throw new Error("Call init() first and set electronFileProtocol");
  }

  await init({
    musicLibraryPath,
    baseUrl,
    isElectron,
    electronFileProtocol: cachedElectronFileProtocol,
  });
  await update({
    musicLibraryPath,
    event,
    scanColor,
  });
};

export const init = async ({
  musicLibraryPath,
  baseUrl,
  isElectron = false,
  artistUrlFragment = "artist",
  albumUrlFragment = "album",
  audioUrlFragment = "audio",
  imageUrlFragment = "image",
  fileUrlFragment = "file",
  electronFileProtocol = "",
}: {
  musicLibraryPath: string;
  baseUrl?: string;
  isElectron: boolean;
  artistUrlFragment?: string;
  albumUrlFragment?: string;
  audioUrlFragment?: string;
  imageUrlFragment?: string;
  fileUrlFragment?: string;
  electronFileProtocol?: string;
}): Promise<MediaCollectionAndFiles> => {
  cachedElectronFileProtocol = electronFileProtocol;

  const totalStart = Date.now();

  logOpStart("Traversing file system");
  let start = Date.now();
  files = await traverseFileSystem(musicLibraryPath);
  logOpReport(start, files, "files");

  logOpStart("Creating media collection");
  start = Date.now();
  const mediaCollection = createMediaCollection({
    files,
    baseUrl: isElectron ? musicLibraryPath : `${baseUrl}`,
    isElectron,
    artistUrlFragment,
    albumUrlFragment,
    audioUrlFragment,
    imageUrlFragment,
    fileUrlFragment,
    electronFileProtocol,
  });
  artistCollection = mediaCollection.artistCollection;
  albumCollection = mediaCollection.albumCollection;
  audioCollection = mediaCollection.audioCollection;
  imageCollection = mediaCollection.imageCollection;
  artistObject = mediaCollection.artistObject;
  artistsForFind = Object.entries(artistCollection).map(([id, a]) => ({ ...a, id }));
  albumsForFind = Object.entries(albumCollection).map(([id, a]) => ({ ...a, id }));
  audiosForFind = Object.entries(audioCollection).map(([id, a]) => ({ ...a, id }));

  console.log(`Took: ${(Date.now() - start) / 1000} seconds`);
  console.log(`Found: ${Object.keys(artistCollection).length} artists`);
  console.log(`Found: ${Object.keys(albumCollection).length} albums`);
  console.log(`Found: ${Object.keys(audioCollection).length} songs`);
  console.log(`Found: ${Object.keys(imageCollection).length} images`);
  console.log("----------------------\n");

  logOpStart("Startup Report");
  console.log(`Took: ${(Date.now() - totalStart) / 1000} seconds total`);
  console.log("----------------------\n");

  return {
    artistCollection,
    albumCollection,
    audioCollection,
    imageCollection,
    artistObject,
    files,
  };
};

export const update = async ({
  musicLibraryPath,
  event,
  scanColor,
}: {
  musicLibraryPath: string;
  event?: IpcMainEvent;
  scanColor?: { INSERT: string; UPDATE: string; ALBUM_UPDATE: string };
}): Promise<void> => {
  if (!files) {
    console.error("Did not get files JSON\n");
    return;
  } else if (isScanningDisabled) {
    console.log("Scanning is disabled\n");
    return;
  }

  const start = Date.now();
  let audios = await Db.getAllAudios();
  let audiosInDb = audios.map((a) => ({ id: a.path_id, modifiedAt: a.modified_at }));
  const cleanFiles = files.filter((file) =>
    audioExts.some((ext) => file.toLowerCase().endsWith(ext))
  );
  const filesWithIds = cleanFiles.map((file) => ({
    id: UrlSafeBase64.encode(file),
    filename: file.split(path.sep).pop() || "",
  }));
  const albums = Object.entries(albumCollection).map(([id, album]) => ({
    id,
    album,
  }));

  const filesToInsert = [];
  const filesToCheck = [];

  for (const file of filesWithIds) {
    if (audiosInDb.find(({ id }) => id === file.id)) {
      filesToCheck.push(file);
    } else {
      filesToInsert.push(file);
    }
  }

  console.log("Scanning file system audio files");
  console.log("----------------------");
  console.log(`Audios to insert: ${filesToInsert.length}`);
  console.log(`Audios to update: ${filesToCheck.length}`);
  console.log(`Albums to update: ${albums.length}`);
  console.log("----------------------");

  if (event) {
    event.sender.send("musa:scan:start", filesToInsert.length, scanColor?.INSERT || "#f00");
  }

  if (filesToInsert.length) {
    console.log();
  }

  const startInsert = Date.now();
  for (let i = 0; i < filesToInsert.length; i += 4) {
    try {
      // I don't know why but this concurrency speeds up the inserts
      // compared to a single awaited promise and it doesn't lock up the thread even
      await Promise.all([
        Db.insertAudio(filesToInsert[i]),
        Db.insertAudio(filesToInsert[i + 1]),
        Db.insertAudio(filesToInsert[i + 2]),
        Db.insertAudio(filesToInsert[i + 3]),
      ]);

      if (process.stdout.clearLine) {
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
        process.stdout.write(
          `Audio insert: (${i + 1} / ${filesToInsert.length}) ` +
            Math.trunc(((i + 1) / filesToInsert.length) * 100) +
            "% "
        );
      }

      if (event) {
        event.sender.send("musa:scan:update", i);
      }
      if (scanProgressListener) {
        scanProgressListener(i / filesToInsert.length, "normal");
      }
    } catch (err) {
      console.error(err);
    }
  }
  const timeForInsertSec = (Date.now() - startInsert) / 1000;
  const insertsPerSecond =
    timeForInsertSec > 0 ? Math.floor(filesToInsert.length / timeForInsertSec) : 0;

  if (filesToInsert.length) {
    console.log();
  }

  console.log("\nScanner Report");
  console.log("----------------------");
  console.log(`Audio inserts took: ${timeForInsertSec} seconds`);
  console.log(`${insertsPerSecond} inserts per second\n`);

  if (event) {
    event.sender.send("musa:scan:end");
    event.sender.send("musa:scan:start", filesToCheck.length, scanColor?.UPDATE || "#ff0");
  }

  const startUpdate = Date.now();
  // TODO: Locks up the thread a little
  const filesToUpdate = (
    await Promise.all(
      filesToCheck.map(async ({ id, filename }, i) => {
        try {
          const { mtimeMs } = await fs.stat(path.join(musicLibraryPath, UrlSafeBase64.decode(id)));
          const audioInDb = audiosInDb.find((a) => id === a.id);

          if (!audioInDb) {
            return;
          }

          if (event) {
            event.sender.send("musa:scan:update", i);
          }

          if (Math.trunc(mtimeMs) > new Date(audioInDb.modifiedAt).getTime()) {
            return { id, filename, modifiedAt: new Date(mtimeMs) };
          }
        } catch (error) {
          console.error(error);
        }
      })
    )
  ).filter(Boolean) as unknown as { id: string; filename: string; modifiedAt: Date }[];

  for (let i = 0; i < filesToUpdate.length; i++) {
    try {
      await Db.updateAudio(filesToUpdate[i]);
    } catch (error) {
      console.error(error);
    }
  }

  const timeForUpdateSec = (Date.now() - startUpdate) / 1000;
  const updatesPerSecond =
    timeForUpdateSec > 0 ? Math.floor(filesToCheck.length / timeForUpdateSec) : 0;
  console.log(`Audio updates took: ${timeForUpdateSec} seconds`);
  console.log(`${updatesPerSecond} updates per second\n`);

  if (event) {
    event.sender.send("musa:scan:end");
    event.sender.send("musa:scan:start", albums.length, scanColor?.ALBUM_UPDATE || "#0f0");
  }

  const startAlbumUpdate = Date.now();
  audios = await Db.getAllAudios();
  audiosInDb = audios.map((a) => ({ id: a.path_id, modifiedAt: a.modified_at }));
  let albumsInDb = await Db.getAlbums();
  // TODO: Locks up the thread a little
  const albumsToUpdate = (
    await Promise.all(
      albums.map((a, i) => {
        const album = a.album;
        const albumAudioIds = album.files.map(({ id }) => id);
        const dbAlbumAudios = audiosInDb.filter(({ id }) => albumAudioIds.includes(id));
        const modifiedAts = dbAlbumAudios.map(({ modifiedAt }) => new Date(modifiedAt).getTime());
        const lastModificationTime = Math.max(...modifiedAts);
        const a2 = albumsInDb.find(({ path_id: id }) => id === a.id);

        if (event) {
          event.sender.send("musa:scan:update", i);
        }

        if (!a2) {
          if (a.album.files.length) {
            return a;
          } else {
            console.log("Empty album", a);
            return;
          }
        }

        if (lastModificationTime > new Date(a2.modified_at).getTime()) {
          return a;
        }
      })
    )
  ).filter(Boolean) as unknown as AlbumUpsertOptions[];

  for (let i = 0; i < albumsToUpdate.length; i++) {
    try {
      await Db.upsertAlbum(albumsToUpdate[i]);
    } catch (err) {
      console.error(err);
    }
  }
  const timeForAlbumUpdateSec = (Date.now() - startAlbumUpdate) / 1000;
  const albumUpdatesPerSecond =
    timeForAlbumUpdateSec > 0 ? Math.floor(albums.length / timeForAlbumUpdateSec) : 0;

  console.log(`Album updates took: ${timeForAlbumUpdateSec} seconds`);
  console.log(`${albumUpdatesPerSecond} updates per second\n`);

  const startTfIdfCalculation = Date.now();

  if (event) {
    event.sender.send("musa:scan:end");
    event.sender.send("musa:scan:complete", Date.now());
  }

  albumsInDb = await Db.getAlbums();
  const albumNames = albumsInDb.map(({ metadata }) => (metadata.album || "").toLowerCase());
  const audioNames = audios.map(({ metadata }) => (metadata.title || "").toLowerCase());
  const documents = Object.keys(artistCollection).length + albumsInDb.length + audios.length;

  updateTf(artistsForFind.map(({ name }) => tokenize(name)).flat(Infinity) as string[]);
  updateTf(albumNames.map(tokenize).flat(Infinity) as string[]);
  updateTf(audioNames.map(tokenize).flat(Infinity) as string[]);
  updateParams(documents);

  const timeForTfIdf = (Date.now() - startTfIdfCalculation) / 1000;
  const totalTime = (Date.now() - start) / 1000;

  console.log(`TF-IDF calculation took: ${timeForTfIdf} seconds`);
  console.log(`Total time: ${totalTime} seconds`);
  console.log("----------------------\n");
};
