import { sep } from "path";

import { traverseFileSystem, audioExts } from "./fs";
import { createMediaCollection } from "./media-separator";
import UrlSafeBase64 from "./urlsafe-base64";
import * as Db from "./db";

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
  await init({ musicLibraryPath, baseUrl, isElectron });
  await update({
    event,
    scanColor,
  });
};

export const init = async ({
  musicLibraryPath,
  baseUrl,
  isElectron = false,
}: {
  musicLibraryPath: string;
  baseUrl?: string;
  isElectron: boolean;
}): Promise<MediaCollectionAndFiles> => {
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
  event,
  scanColor,
}: {
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
  const audios = await Db.getAllAudios();
  const audioIdsInDb = audios.map((a) => a.path_id);
  const cleanFiles = files.filter((file) =>
    audioExts.some((ext) => file.toLowerCase().endsWith(ext))
  );
  const filesWithIds = cleanFiles.map((file) => ({
    id: UrlSafeBase64.encode(file),
    filename: file.split(sep).pop() || "",
  }));
  const albums = Object.entries(albumCollection).map(([id, album]) => ({
    id,
    album,
  }));

  const filesToInsert = [];
  const filesToUpdate = [];

  for (const file of filesWithIds) {
    if (audioIdsInDb.includes(file.id)) {
      filesToUpdate.push(file);
    } else {
      filesToInsert.push(file);
    }
  }

  console.log("Scanning file system audio files");
  console.log("----------------------");
  console.log(`Audios to insert: ${filesToInsert.length}`);
  console.log(`Audios to update: ${filesToUpdate.length}`);
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
    event.sender.send("musa:scan:start", filesToUpdate.length, scanColor?.UPDATE || "#f00");
  }

  const startUpdate = Date.now();
  for (let i = 0; i < filesToUpdate.length; i += 4) {
    try {
      await Promise.all([
        Db.upsertAudio({
          ...filesToUpdate[i],
          quiet: true,
        }),
        Db.upsertAudio({
          ...filesToUpdate[i + 1],
          quiet: true,
        }),
        Db.upsertAudio({
          ...filesToUpdate[i + 2],
          quiet: true,
        }),
        Db.upsertAudio({
          ...filesToUpdate[i + 3],
          quiet: true,
        }),
      ]);

      if (event) {
        event.sender.send("musa:scan:update", i);
      }
    } catch (err) {
      console.error(err);
    }
  }
  const timeForUpdateSec = (Date.now() - startUpdate) / 1000;
  const updatesPerSecond =
    timeForUpdateSec > 0 ? Math.floor(filesToUpdate.length / timeForUpdateSec) : 0;
  console.log(`Audio updates took: ${timeForUpdateSec} seconds`);
  console.log(`${updatesPerSecond} updates per second\n`);

  if (event) {
    event.sender.send("musa:scan:end");
    event.sender.send("musa:scan:start", albums.length, scanColor?.ALBUM_UPDATE || "#f00");
  }

  const startAlbumUpdate = Date.now();
  for (let i = 0; i < albums.length; i += 4) {
    try {
      await Promise.all([
        Db.upsertAlbum(albums[i]),
        Db.upsertAlbum(albums[i + 1]),
        Db.upsertAlbum(albums[i + 2]),
        Db.upsertAlbum(albums[i + 3]),
      ]);

      if (event) {
        event.sender.send("musa:scan:update", i);
      }
    } catch (err) {
      console.error(err);
    }
  }
  const timeForAlbumUpdateSec = (Date.now() - startAlbumUpdate) / 1000;
  const albumUpdatesPerSecond =
    timeForAlbumUpdateSec > 0 ? Math.floor(albums.length / timeForAlbumUpdateSec) : 0;
  const totalTime = (Date.now() - start) / 1000;

  console.log(`Album updates took: ${timeForAlbumUpdateSec} seconds`);
  console.log(`${albumUpdatesPerSecond} updates per second\n`);
  console.log(`Total time: ${totalTime} seconds`);
  console.log("----------------------\n");

  if (event) {
    event.sender.send("musa:scan:end");
    event.sender.send("musa:scan:complete", Date.now());
  }
};
