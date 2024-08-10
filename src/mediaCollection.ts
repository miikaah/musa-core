import { normalizeSearchString } from "./api/find.utils";
import {
  AlbumCollection,
  ArtistCollection,
  ArtistObject,
  FileCollection,
  MediaCollection,
} from "./mediaSeparator.types";
import { AlbumsForFind, ArtistsForFind, AudiosForFind } from "./scanner.types";

let artistCollection: ArtistCollection = {};
let albumCollection: AlbumCollection = {};
let audioCollection: FileCollection = {};
let imageCollection: FileCollection = {};
let artistObject: ArtistObject;

let artistsForFind: ArtistsForFind = [];
let albumsForFind: AlbumsForFind = [];
let audiosForFind: AudiosForFind = [];

export const setMediaCollection = (collections: MediaCollection) => {
  setPartialMediaCollectionForTest(collections);
};

const toSearchMedia = <T extends { name: string }>([id, media]: [string, T]) => {
  return {
    ...media,
    id,
    searchName: normalizeSearchString(media.name),
  };
};

export const setPartialMediaCollectionForTest = (
  collections: Partial<MediaCollection>,
) => {
  artistCollection = collections.artistCollection || {};
  albumCollection = collections.albumCollection || {};
  audioCollection = collections.audioCollection || {};
  imageCollection = collections.imageCollection || {};
  artistObject = collections.artistObject || {};

  artistsForFind = Object.entries(artistCollection).map(toSearchMedia);
  albumsForFind = Object.entries(albumCollection).map(toSearchMedia);
  audiosForFind = Object.entries(audioCollection).map(toSearchMedia);
};

export const getArtistCollection = (): ArtistCollection => {
  return artistCollection;
};

export const findArtistInCollectionById = (
  id?: string,
): ArtistCollection[0] | undefined => {
  return artistCollection[id ?? ""];
};

export const getAlbumCollection = (): AlbumCollection => {
  return albumCollection;
};

export const findAlbumInCollectionById = (
  id?: string,
): AlbumCollection[0] | undefined => {
  return albumCollection[id ?? ""];
};

export const getAudioCollection = (): FileCollection => {
  return audioCollection;
};

export const findAudioInCollectionById = (id?: string): FileCollection[0] | undefined => {
  return audioCollection[id ?? ""];
};

export const getImageCollection = (): FileCollection => {
  return imageCollection;
};

export const getArtistObject = (): ArtistObject => {
  return artistObject;
};

export const getArtistsForFind = (): ArtistsForFind => {
  return artistsForFind;
};

export const getAlbumsForFind = (): AlbumsForFind => {
  return albumsForFind;
};

export const getAudiosForFind = (): AudiosForFind => {
  return audiosForFind;
};
