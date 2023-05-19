import * as Db from "../db";
import { DbPlaylist } from "../db.types";
import { Playlist } from "./playlist.types";

export const insertPlaylist = async ({
  pathIds,
  createdByUserId,
}: {
  pathIds: string[];
  createdByUserId: string;
}): Promise<Playlist> => {
  const playlist = await Db.insertPlaylist({ pathIds, createdByUserId });

  return toApiPlaylist(playlist);
};

export const getPlaylist = async (id: string): Promise<Playlist | undefined> => {
  const playlist = await Db.getPlaylist(id);

  if (!playlist) {
    throw new Error("Playlist Not Found");
  }

  return toApiPlaylist(playlist);
};

function toApiPlaylist(playlist: DbPlaylist): Playlist {
  return {
    id: playlist.playlist_id,
    modifiedAt: playlist.modified_at,
    pathIds: playlist.path_ids,
    createdByUserId: playlist.created_by_user_id,
  };
}
