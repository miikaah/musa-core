import { Metadata } from "./metadata.types";

export type DbAudio = {
  path_id: string;
  modified_at: string;
  filename: string;
  metadata: Metadata;
};

export type DbAlbum = {
  path_id: string;
  modified_at: string;
  metadata: Partial<Metadata>;
  id?: string; // DEPRECATED but still might exist
};

export type RgbColor = [number, number, number];

export type Colors = {
  bg: RgbColor;
  primary: RgbColor;
  secondary: RgbColor;
  slider: RgbColor;
  typography: string;
  typographyGhost: string;
  typographyPrimary: string;
  typographySecondary: string;
};

export type DbTheme = {
  path_id: string;
  modified_at: string;
  colors: Colors;
  filename: string;
};

export type DbExternalAudio = {
  path_id: string;
  modified_at: string;
  filename: string;
  filepath: string;
  metadata: Metadata;
};

export type DbPlaylist = {
  playlist_id: string;
  modified_at: string;
  path_ids: string[];
  created_by_user_id: string;
};

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
  coverUrl: string;
  year: number | string | undefined;
  files: EnrichedAlbumFile[];
};

export type EnrichedAlbumFile = {
  id: string;
  name: string;
  url: string;
  track: string;
  fileUrl: string;
  metadata: Metadata;
  coverUrl: string;
};
