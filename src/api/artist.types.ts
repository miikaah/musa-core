import { EnrichedAlbum } from "../db.types";
import { ArtistWithAlbums } from "../media-separator.types";

export type ArtistAlbum = {
  id: string;
  name: string;
  url: string;
  coverUrl?: string;
  year?: number | string | null;
};

export type Artist = Omit<ArtistWithAlbums, "albums"> & {
  albums: ArtistAlbum[];
};

export type ArtistWithEnrichedAlbums = Omit<ArtistWithAlbums, "albums"> & {
  albums: EnrichedAlbum[];
};
