import { getAlbumById } from "./api/album";
import { getArtistAlbums, getArtistById, getArtists } from "./api/artist";
import { getAudioById, getAudiosByFilepaths } from "./api/audio";
import { find, findRandom } from "./api/find";
import { getAllGenres } from "./api/genre";
import { getAllThemes, getTheme, insertTheme, removeTheme, updateTheme } from "./api/theme";
import { initDb } from "./db";
import { getState, setState } from "./fs-state";
import { writeTags } from "./metadata";
import { init, refresh, setScanProgressListener, update } from "./scanner";
import UrlSafeBase64 from "./urlsafe-base64";

const Api = {
  getAlbumById,
  getArtists,
  getArtistById,
  getArtistAlbums,
  getAudioById,
  getAudiosByFilepaths,
  find,
  findRandom,
  getAllThemes,
  getTheme,
  insertTheme,
  updateTheme,
  removeTheme,
  getAllGenres,
  writeTags,
};

const Db = {
  init: initDb,
};

const Scanner = {
  init,
  update,
  refresh,
  setScanProgressListener,
};

const Fs = {
  getState,
  setState,
};

export type { AlbumWithFilesAndMetadata } from "./api/album.types";
export type { Artist, ArtistWithEnrichedAlbums } from "./api/artist.types";
export type { AudioWithMetadata } from "./api/audio.types";
export type { FindResult } from "./api/find.types";
export type { Theme } from "./api/theme.types";
export type { State } from "./fs-state.types";
export type {
  AlbumCollection,
  AlbumFile,
  AlbumWithFiles,
  ArtistCollection,
  ArtistObject,
  ArtistWithAlbums,
  File,
  FileCollection,
  FileWithInfo,
  MediaCollection,
} from "./media-separator.types";
export type { Metadata } from "./metadata.types";
export type { MediaCollectionAndFiles } from "./scanner.types";
export { Api, Db, Fs, Scanner, UrlSafeBase64 };
