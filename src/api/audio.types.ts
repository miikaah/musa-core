import { FileWithInfo } from "../mediaSeparator.types";
import { Metadata } from "../metadata.types";

export type AudioWithMetadata = FileWithInfo & {
  track: string | null;
  coverUrl?: string;
  metadata: Metadata;
};

export type AudioReturnType = AudioWithMetadata | Record<string, never>;
