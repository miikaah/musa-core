import { EnrichedAlbumFile } from "../db.types";
import { AlbumWithFiles } from "../media-separator.types";
import { Metadata } from "../metadata.types";

export type AlbumWithFilesAndMetadata = Omit<AlbumWithFiles, "files"> & {
  id: string;
  metadata: Metadata;
  files: EnrichedAlbumFile[];
};
