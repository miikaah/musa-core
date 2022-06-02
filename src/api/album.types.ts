import { AlbumWithFiles } from "../media-separator.types";
import { Metadata } from "../metadata.types";
import { EnrichedAlbumFile } from "../db.types";

export type AlbumWithFilesAndMetadata = Omit<AlbumWithFiles, "files"> & {
  id: string;
  metadata: Metadata;
  files: EnrichedAlbumFile[];
};
