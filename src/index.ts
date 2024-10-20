import { findAlbumById } from "./api/album";
import { getArtistAlbums, getArtistById, getArtists } from "./api/artist";
import { findAudioById, getAudiosByFilepaths, getAudiosByPlaylistId } from "./api/audio";
import { find, findRandom } from "./api/find";
import { getAllGenres } from "./api/genre";
import { getPlaylist, insertPlaylist } from "./api/playlist";
import {
  getAllThemes,
  getTheme,
  insertTheme,
  removeTheme,
  updateTheme,
} from "./api/theme";
import { checkMusadirExists } from "./checkMusadirExists";
import { initDb } from "./db";
import { getState, setState } from "./fsState";
import { getCurrentProfileByIp, listDevices } from "./infra/tailscale";
import { writeTags, writeTagsMany } from "./metadata";
import { normalizeMany } from "./normalization";
import { init, refresh, setScanProgressListener, update } from "./scanner";
import { createThreadPool, destroyThreadPool, hasThreadPool } from "./threadPool";
import UrlSafeBase64 from "./urlSafeBase64";

const Api = {
  findAlbumById,
  getArtists,
  getArtistById,
  getArtistAlbums,
  findAudioById,
  getAudiosByFilepaths,
  getAudiosByPlaylistId,
  find,
  findRandom,
  getAllThemes,
  getTheme,
  insertTheme,
  updateTheme,
  removeTheme,
  getAllGenres,
  writeTags,
  writeTagsMany,
  insertPlaylist,
  getPlaylist,
};

const Fs = {
  getState,
  setState,
  checkMusadirExists,
};

const Db = {
  init: initDb,
};

const Normalization = {
  normalizeMany,
};

const Scanner = {
  init,
  update,
  refresh,
  setScanProgressListener,
};

const Tailscale = {
  listDevices,
  getCurrentProfileByIp,
};

const Thread = {
  createThreadPool,
  destroyThreadPool,
  hasThreadPool,
};

export type { AlbumWithFilesAndMetadata } from "./api/album.types";
export type { Artist, ArtistWithEnrichedAlbums } from "./api/artist.types";
export type { AudioWithMetadata } from "./api/audio.types";
export type { FindResult } from "./api/find.types";
export type { Playlist } from "./api/playlist.types";
export type { Theme } from "./api/theme.types";
export type { Colors, EnrichedAlbumFile, RgbColor } from "./db.types";
export type { State } from "./fsState.types";
export type {
  TailscaleDevice,
  TailscaleListDevicesResponse,
} from "./infra/tailscale/tailscale.types";
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
} from "./mediaSeparator.types";
export type { Metadata, Tags } from "./metadata.types";
export type {
  NormalizationError,
  NormalizationResult,
  NormalizationResults,
  NormalizationUnit,
} from "./normalization.types";
export type { MediaCollectionAndFiles } from "./scanner.types";
export { Api, Db, Fs, Normalization, Scanner, Tailscale, Thread, UrlSafeBase64 };
