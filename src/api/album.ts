import { AlbumCollection, AlbumWithFiles } from "../media-separator";
import { Metadata } from "../metadata";
import { getAlbum, enrichAlbumFiles, EnrichedAlbumFile } from "../db";

export type ApiAlbumWithFilesAndMetadata = Omit<AlbumWithFiles, "files"> & {
  metadata: Metadata;
  files: EnrichedAlbumFile[];
};

export const getAlbumById = async (
  albumCollection: AlbumCollection,
  id: string
): Promise<ApiAlbumWithFilesAndMetadata> => {
  const album = albumCollection[id];

  if (!album) {
    // @ts-expect-error return empty
    return {};
  }

  const dbAlbum = await getAlbum(id);
  const files = await enrichAlbumFiles(album);

  return {
    ...album,
    metadata: dbAlbum?.metadata,
    files,
  };
};
