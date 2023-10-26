import { enrichAlbums, getAudio } from "../db";
import {
  findArtistInCollectionById,
  getAlbumCollection,
  getArtistObject,
} from "../mediaCollection";

import { ArtistObject } from "../mediaSeparator.types";
import { Artist, ArtistAlbum, ArtistWithEnrichedAlbums } from "./artist.types";

export const getArtists = async (): Promise<ArtistObject> => {
  return getArtistObject();
};

const byYear = (a: ArtistAlbum, b: ArtistAlbum) => Number(a.year) - Number(b.year);

export const getArtistById = async (
  id: string,
): Promise<Artist | Record<string, never>> => {
  const artist = findArtistInCollectionById(id);

  if (!artist) {
    return {};
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

export const getArtistAlbums = async (
  id: string,
): Promise<ArtistWithEnrichedAlbums | Record<string, never>> => {
  const artist = findArtistInCollectionById(id);

  if (!artist) {
    return {};
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
        track: track === "00" ? null : track,
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
