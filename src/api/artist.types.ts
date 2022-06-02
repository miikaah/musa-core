import { ArtistWithAlbums } from "../media-separator.types";
import { EnrichedAlbum } from "../db.types";

export type ArtistAlbum = {
  id: string;
  name: string;
  url: string;
  coverUrl?: string;
  year?: number | null;
};

export type Artist = Omit<ArtistWithAlbums, "albums"> & {
  albums: EnrichedAlbum[];
};
