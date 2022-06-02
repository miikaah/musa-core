import { Metadata } from "./metadata.types";

export type DbAudio = {
  path_id: string;
  modified_at: string;
  filename: string;
  metadata: Metadata;
};
export type DbAlbum = { path_id: string; modified_at: string; metadata: Metadata };
export type DbTheme = { colors: unknown; filename: string; path_id: string };

export type AlbumUpsertOptions = {
  id: string;
  album: {
    name: string;
    files: { id: string }[];
  };
};

export type EnrichedAlbum = {
  id: string;
  name: string;
  url: string;
  coverUrl?: string;
  year?: number | null;
};

export type EnrichedAlbumFile = {
  id?: string;
  name: string;
  track: string;
  fileUrl?: string;
  metadata?: Metadata;
};
