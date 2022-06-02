import { ArtistWithAlbums, ArtistObject } from "../media-separator";
import { getAudio, enrichAlbums, EnrichedAlbum } from "../db";
import { artistCollection, albumCollection, artistObject } from "../scanner";

type ArtistAlbum = {
  id: string;
  name: string;
  url: string;
  coverUrl?: string;
  year?: number | null;
};

export type ApiArtist = Omit<ArtistWithAlbums, "albums"> & {
  albums: EnrichedAlbum[];
};

export const getArtists = async (): Promise<ArtistObject> => {
  return artistObject;
};

const byYear = (a: ArtistAlbum, b: ArtistAlbum) => Number(a.year) - Number(b.year);

export const getArtistById = async (id: string): Promise<ApiArtist | Record<string, never>> => {
  const artist = artistCollection[id];

  if (!artist) {
    return {};
  }

  const albums: ArtistAlbum[] = await Promise.all(
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
    })
  );

  return {
    ...artist,
    albums: albums.sort(byYear),
  };
};

export const getArtistAlbums = async (id: string): Promise<ApiArtist | Record<string, never>> => {
  const artist = artistCollection[id];

  if (!artist) {
    return {};
  }

  const albums = await enrichAlbums(albumCollection, artist);
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
    })
  );

  return {
    ...artist,
    albums: albums.sort(byYear),
    files,
  };
};
