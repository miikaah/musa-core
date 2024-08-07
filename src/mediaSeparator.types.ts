import { Metadata } from "./metadata.types";

export type MediaCollection = {
  artistCollection: ArtistCollection;
  albumCollection: AlbumCollection;
  audioCollection: FileCollection;
  imageCollection: FileCollection;
  artistObject: ArtistObject;
};

export type ArtistCollection = {
  [x: string]: ArtistWithAlbums;
};

export type File = {
  id: string;
  name: string;
  url: string;
  fileUrl: string;
  track?: string;
  metadata?: Metadata;
};

export type AlbumFile = {
  id: string;
  name: string;
  url: string;
  coverUrl: string;
  // Used for artist metadata creation
  firstAlbumAudio?: {
    id: string;
    name: string;
  };
};

export type ArtistWithAlbums = {
  url: string;
  name: string;
  albums: AlbumFile[];
  files: File[];
  images: File[];
};

export type AlbumCollection = {
  [x: string]: AlbumWithFiles;
};

export type AlbumWithFiles = {
  artistName: string;
  artistUrl: string;
  name: string;
  files: File[];
  images: File[];
  coverUrl: string;
};

export type FileCollection = {
  [x: string]: FileWithInfo;
};

export type FileWithInfo = File & {
  artistName: string;
  artistUrl: string;
  albumId?: string;
  albumName?: string;
  albumUrl?: string;
  albumCoverUrl?: string;
};

export type ArtistObject = {
  [label: string]: { id: string; name: string; url: string }[];
};
