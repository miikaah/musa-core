import { AlbumWithFilesAndMetadata } from "./album.types";
import { Artist } from "./artist.types";
import { AudioWithMetadata } from "./audio.types";

export type FindResult = {
  artists: Artist[];
  albums: AlbumWithFilesAndMetadata[];
  audios: AudioWithMetadata[];
};
