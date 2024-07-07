import {
  AlbumWithFiles,
  ArtistWithAlbums,
  FileWithInfo,
  MediaCollection,
} from "./mediaSeparator.types";

export type ArtistWithId = ArtistWithAlbums & { id: string };
export type AlbumWithId = AlbumWithFiles & { id: string };
export type FileWithId = FileWithInfo & { id: string };
export type ArtistsForFind = ArtistWithId[];
export type AlbumsForFind = AlbumWithId[];
export type AudiosForFind = FileWithId[];

export type MediaCollectionAndFiles = MediaCollection & { files: string[] };

export type IpcMainEvent = {
  sender: {
    send: (...args: any) => void;
  };
};
