import UrlSafeBase64 from "./urlsafe-base64";
import { getAlbumById } from "./api/album";
import { getArtistById, getArtistAlbums, getArtists } from "./api/artist";
import { getAudioById } from "./api/audio";
import { find, findRandom } from "./api/find";
import { getAllThemes, getTheme, insertTheme, removeTheme } from "./api/theme";
import { initDb } from "./db";
import { init, update, refresh } from "./scanner";
import { getState, setState } from "./fs-state";

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
};

const Db = {
  init: initDb,
};

const Scanner = {
  init,
  update,
  refresh,
};

const Fs = {
  getState,
  setState,
};

export { Api, Db, Fs, Scanner, UrlSafeBase64 };

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
} from "./media-separator.types";
export type { Metadata } from "./metadata.types";
export type { MediaCollectionAndFiles } from "./scanner.types";
export type { State } from "./fs-state.types";
export type { AlbumWithFilesAndMetadata } from "./api/album.types";
export type { Artist, ArtistWithEnrichedAlbums } from "./api/artist.types";
export type { AudioWithMetadata } from "./api/audio.types";
export type { FindResult } from "./api/find.types";
export type { Theme } from "./api/theme.types";
