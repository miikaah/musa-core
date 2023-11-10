import { getAlbumById } from "./api/album";
import { getArtistAlbums, getArtistById, getArtists } from "./api/artist";
import { getAudioById, getAudiosByFilepaths, getAudiosByPlaylistId } from "./api/audio";
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
import { initDb } from "./db";
import { getState, setState } from "./fsState";
import { getCurrentProfileByIp, listDevices } from "./infra/tailscale";
import { writeTags } from "./metadata";
import { init, refresh, setScanProgressListener, update } from "./scanner";
import UrlSafeBase64 from "./urlSafeBase64";

const Api = {
  getAlbumById,
  getArtists,
  getArtistById,
  getArtistAlbums,
  getAudioById,
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
  insertPlaylist,
  getPlaylist,
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

const Tailscale = {
  listDevices,
  getCurrentProfileByIp,
};

export type { AlbumWithFilesAndMetadata } from "./api/album.types";
export type { Artist, ArtistWithEnrichedAlbums } from "./api/artist.types";
export type { AudioWithMetadata } from "./api/audio.types";
export type { FindResult } from "./api/find.types";
export type { Playlist } from "./api/playlist.types";
export type { Theme } from "./api/theme.types";
export type { State } from "./fsState.types";
export type { RgbColor, Colors, EnrichedAlbumFile } from "./db.types";
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
export type { MediaCollectionAndFiles } from "./scanner.types";
export { Api, Db, Fs, Scanner, UrlSafeBase64, Tailscale };
