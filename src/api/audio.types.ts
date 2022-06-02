import { FileWithInfo } from "../media-separator.types";
import { Metadata } from "../metadata.types";

export type AudioWithMetadata = FileWithInfo & {
  track: string | null;
  coverUrl?: string;
  metadata: Metadata;
};
