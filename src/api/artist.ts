import { enrichAlbums, getAudio } from "../db";
import {
  findArtistInCollectionById,
  getAlbumCollection,
  getArtistObject,
} from "../mediaCollection";
import { ArtistObject } from "../mediaSeparator.types";
import { Artist, ArtistAlbum, ArtistWithEnrichedAlbums } from "./artist.types";
import { normalizeSearchString } from "./find.utils";

export const getArtists = async (): Promise<ArtistObject> => {
  return getArtistObject();
};

const byYear = (a: ArtistAlbum, b: ArtistAlbum) => Number(a.year) - Number(b.year);

export const getArtistById = async (id: string): Promise<Artist> => {
  const artist = findArtistInCollectionById(id);

  if (!artist) {
    throw new Error(`Artist not found by id ${id}`);
  }

  const albums = await Promise.all(
    artist.albums.map(async ({ id, name, url, coverUrl, firstAlbumAudio }) => {
      let year = null;
      let albumName = null;

      if (firstAlbumAudio && firstAlbumAudio.id) {
        const audio = await getAudio(firstAlbumAudio.id);

        year = audio?.metadata?.year;
        albumName = audio?.metadata?.album;
      }

      return {
        id,
        name: albumName || name,
        url,
        coverUrl,
        year,
      };
    }),
  );

  return {
    ...artist,
    albums: albums.sort(byYear),
  };
};

export const getArtistAlbums = async (id: string): Promise<ArtistWithEnrichedAlbums> => {
  const artist = findArtistInCollectionById(id);

  if (!artist) {
    throw new Error(`Artist not found by id ${id}`);
  }

  const albums = await enrichAlbums(getAlbumCollection(), artist);
  const files = await Promise.all(
    artist.files.map(async (file) => {
      const dbAudio = await getAudio(file.id);
      const name = dbAudio?.metadata?.title || file.name;
      const trackNo = `${dbAudio?.metadata?.track?.no || ""}`;
      const diskNo = `${dbAudio?.metadata?.disk?.no || ""}`;
      const track = `${diskNo ? `${diskNo}.` : ""}${trackNo.padStart(2, "0")}`;

      return {
        ...file,
        name,
        track: track === "00" ? "" : track,
        metadata: dbAudio?.metadata,
      };
    }),
  );

  return {
    ...artist,
    albums: albums.sort(byYear),
    files,
  };
};

export type GetArtistAlbumsWithSearchNameResult = ArtistWithEnrichedAlbums & {
  searchName: string;
};

export const getArtistAlbumsWithSearchName = async (
  id: string,
): Promise<GetArtistAlbumsWithSearchNameResult> => {
  const artist = await getArtistAlbums(id);

  return {
    ...artist,
    searchName: normalizeSearchString(artist.name),
  };
};
