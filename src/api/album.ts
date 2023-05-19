import { enrichAlbumFiles, getAlbum } from "../db";
import { findAlbumInCollectionById } from "../mediaCollection";

import { AlbumWithFilesAndMetadata } from "./album.types";

export const getAlbumById = async (
  id: string
): Promise<AlbumWithFilesAndMetadata | Record<string, never>> => {
  const album = findAlbumInCollectionById(id);

  if (!album) {
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
