import { AlbumWithFilesAndMetadata } from "./album.types";
import { ArtistWithEnrichedAlbums } from "./artist.types";
import { AudioWithMetadata } from "./audio.types";

export type FindResult = {
  artists: ArtistWithEnrichedAlbums[];
  albums: AlbumWithFilesAndMetadata[];
  audios: AudioWithMetadata[];
};
