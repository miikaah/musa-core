import UrlSafeBase64 from "./urlsafe-base64";
import { getAlbumById } from "./api/album";
import { getArtistById, getArtistAlbums, getArtists } from "./api/artist";
import { getAudioById } from "./api/audio";
import { find, findRandom } from "./api/find";
import {
  initDb,
  getAllThemes,
  getTheme,
  insertTheme,
  removeTheme,
  getAllAudios,
  insertAudio,
  upsertAudio,
  upsertAlbum,
} from "./db";
import { init, update, refresh } from "./scanner";

const Api = {
  getAlbumById,
  getArtists,
  getArtistById,
  getArtistAlbums,
  getAudioById,
  find,
  findRandom,
  getAllThemes,
  getTheme,
  insertTheme,
  removeTheme,
  getAllAudios,
  insertAudio,
  upsertAudio,
  upsertAlbum,
};

const Db = {
  init: initDb,
};

const Scanner = {
  init,
  update,
  refresh,
};

export { Api, Db, Scanner, UrlSafeBase64 };

export type {
  MediaCollection,
  ArtistCollection,
  AlbumCollection,
  FileCollection,
  ArtistObject,
  File,
  AlbumFile,
  ArtistWithAlbums,
  AlbumWithFiles,
  FileWithInfo,
} from "./media-separator";
export type { Metadata } from "./metadata";
export type { MediaCollectionAndFiles } from "./scanner";
export type { DbAudio, DbAlbum, DbTheme } from "./db";
export type { ApiAlbumWithFilesAndMetadata } from "./api/album";
export type { ApiArtist } from "./api/artist";
export type { ApiAudioWithMetadata } from "./api/audio";
export type { ApiFindResult } from "./api/find";
