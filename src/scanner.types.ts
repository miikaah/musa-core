import {
  AlbumWithFiles,
  ArtistWithAlbums,
  FileWithInfo,
  MediaCollection,
} from "./media-separator.types";

export type ArtistWithId = ArtistWithAlbums & { id: string };
export type AlbumWithId = AlbumWithFiles & { id: string };
export type FileWithId = FileWithInfo & { id: string };
export type ArtistsForFind = ArtistWithId[];
export type AlbumsForFind = AlbumWithId[];
export type AudiosForFind = FileWithId[];

export type MediaCollectionAndFiles = MediaCollection & { files: string[] };

export type IpcMainEvent = {
  sender: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    send: (...args: any) => void;
  };
};
