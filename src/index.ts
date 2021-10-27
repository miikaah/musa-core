import UrlSafeBase64 from "./urlsafe-base64";
import { getAlbumById } from "./api/album";
import { getArtistById, getArtistAlbums } from "./api/artist";
import { getAudioById } from "./api/audio";
import { find, findRandom } from "./api/find";
import { initDb, getAllThemes, getTheme, insertTheme, removeTheme } from "./db";

const MusaCoreApi = {
  initDb,
  getAlbumById,
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

export { MusaCoreApi, UrlSafeBase64 };
export * from "./fs";
export * from "./media-separator";

export type { Metadata } from "./metadata";
export type { ApiAlbumWithFilesAndMetadata } from "./api/album";
export type { ApiArtist } from "./api/artist";
export type { ApiAudioWithMetadata } from "./api/audio";
export type { ApiFindResult } from "./api/find";
