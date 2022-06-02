import { getAlbum, enrichAlbumFiles } from "../db";
import { albumCollection } from "../scanner";

import { AlbumWithFilesAndMetadata } from "./album.types";

export const getAlbumById = async (
  id: string
): Promise<AlbumWithFilesAndMetadata | Record<string, never>> => {
  const album = albumCollection[id];

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
