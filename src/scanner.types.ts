import {
  AlbumWithFiles,
  ArtistWithAlbums,
  FileWithInfo,
  MediaCollection,
} from "./mediaSeparator.types";

type SearchTypes = {
  id: string;
  searchName: string;
};

export type ArtistWithId = ArtistWithAlbums & SearchTypes;
export type AlbumWithId = AlbumWithFiles & SearchTypes;
export type FileWithId = FileWithInfo & SearchTypes;
export type ArtistsForFind = ArtistWithId[];
export type AlbumsForFind = AlbumWithId[];
export type AudiosForFind = FileWithId[];

export type MediaCollectionAndFiles = MediaCollection & { files: string[] };

export type IpcMainEvent = {
  sender: {
    send: (...args: any) => void;
  };
};
