import { AlbumWithFiles } from "../media-separator";
import { Metadata } from "../metadata";
import { getAlbum, enrichAlbumFiles, EnrichedAlbumFile } from "../db";
import { albumCollection } from "../scanner";

export type ApiAlbumWithFilesAndMetadata = Omit<AlbumWithFiles, "files"> & {
  id: string;
  metadata: Metadata;
  files: EnrichedAlbumFile[];
};

export const getAlbumById = async (id: string): Promise<ApiAlbumWithFilesAndMetadata> => {
  const album = albumCollection[id];

  if (!album) {
    // @ts-expect-error return empty
    return {};
  }

  const dbAlbum = await getAlbum(id);
  const files = await enrichAlbumFiles(album);

  return {
    ...album,
    id,
    metadata: dbAlbum?.metadata,
    files,
  };
};
