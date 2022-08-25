import path, { sep, ParsedPath } from "path";

import { imageExts } from "./fs";
import UrlSafeBase64 from "./urlsafe-base64";

import {
  MediaCollection,
  ArtistCollection,
  AlbumCollection,
  FileCollection,
  ArtistObject,
} from "./media-separator.types";

export const createMediaCollection = ({
  files,
  baseUrl,
  isElectron = false,
  artistUrlFragment = "artist",
  audioUrlFragment = "audio",
  imageUrlFragment = "image",
  electronFileProtocol = "",
}: {
  files: string[];
  baseUrl: string;
  isElectron?: boolean;
  artistUrlFragment?: string;
  audioUrlFragment?: string;
  imageUrlFragment?: string;
  electronFileProtocol?: string;
}): MediaCollection => {
  if (isElectron) {
    if (!electronFileProtocol) {
      throw new Error("Specify file protocol for Electron e.g. media://");
    }
  }

  const artistCollection: ArtistCollection = {};
  const albumCollection: AlbumCollection = {};
  const audioCollection: FileCollection = {};
  const imageCollection: FileCollection = {};

  const albumSet = new Set();

  for (const file of files) {
    const [artistName, ...rest] = file.split(sep);
    const artistId = UrlSafeBase64.encode(artistName);
    const fileId = UrlSafeBase64.encode(file);
    const artistUrl = isElectron ? "" : getUrl(baseUrl, artistUrlFragment, artistId);
    const audioUrl = isElectron ? "" : getUrl(baseUrl, audioUrlFragment, fileId);
    const imageUrl = isElectron ? "" : getUrl(baseUrl, imageUrlFragment, fileId);
    const url = isElectron
      ? getElectronUrl(electronFileProtocol, file)
      : getUrl(baseUrl, "file", fileId);

    if (!artistCollection[artistId]) {
      artistCollection[artistId] = {
        url: artistUrl,
        name: artistName,
        albums: [],
        files: [],
        images: [],
      };
    }

    // First pass
    if (rest.length === 1) {
      // This file is in the artist folder
      rest.forEach((name) => {
        const fileWithInfo = {
          id: fileId,
          name,
          artistName,
          artistUrl,
          url,
          fileUrl: url,
        };

        if (isImage(name)) {
          artistCollection[artistId].images.push({
            id: fileId,
            name,
            url: imageUrl,
            fileUrl: url,
          });
          imageCollection[fileId] = fileWithInfo;
        } else {
          artistCollection[artistId].files.push({
            id: fileId,
            name,
            url: audioUrl,
            fileUrl: url,
          });
          audioCollection[fileId] = fileWithInfo;
        }
      });
    } else {
      // This file is in an album folder
      const [albumName, ...albumRest] = rest;
      const albumId = UrlSafeBase64.encode(path.join(artistName, albumName));
      const albumUrl = isElectron ? "" : getUrl(baseUrl, "album", albumId);
      const fileName = albumRest[albumRest.length - 1];

      if (!albumCollection[albumId]) {
        albumCollection[albumId] = {
          name: albumName,
          artistName,
          artistUrl,
          files: [],
          images: [],
        };
      }

      if (!albumSet.has(albumId)) {
        albumSet.add(albumId);
        artistCollection[artistId].albums.push({
          id: albumId,
          name: albumName,
          url: albumUrl,
        });
      }

      const fileWithInfo = {
        id: fileId,
        name: fileName,
        artistName,
        artistUrl,
        albumId,
        albumName,
        albumUrl,
        url,
      };

      if (isImage(fileName)) {
        albumCollection[albumId].images.push({
          id: fileId,
          name: fileName,
          url: imageUrl,
          fileUrl: url,
        });
        imageCollection[fileId] = fileWithInfo;

        const parsedFile = path.parse(fileName);
        if (isAlbumCoverImage(albumName, parsedFile)) {
          albumCollection[albumId].coverUrl = url;

          const albumIndex = artistCollection[artistId].albums.findIndex(
            (a) => a.name === albumName
          );
          if (albumIndex > -1) {
            const album = artistCollection[artistId].albums[albumIndex];
            album.coverUrl = url;
          }
        }
      } else {
        albumCollection[albumId].files.push({
          id: fileId,
          name: fileName,
          url: audioUrl,
          fileUrl: url,
        });
        audioCollection[fileId] = fileWithInfo;
      }
    }
  }

  // Second pass for enriching artist album lists with missing album covers
  // and first album audios needed for artist metadata creation
  Object.keys(artistCollection).forEach((key) => {
    artistCollection[key].albums.forEach((a) => {
      // a.url for server, a.id for Electron
      const id = a.url.split("/").pop() || a.id || "";
      const files = albumCollection[id].files;

      // This code has to be here before early return
      if (!a.firstAlbumAudio && typeof files[0] === "object") {
        const { id, name } = files[0];
        a.firstAlbumAudio = { id, name };
      }

      if (a.coverUrl) {
        return;
      }

      const images = albumCollection[id].images;

      // Find an image with a default name
      for (const img of images) {
        if (isDefaultNameImage(img.name)) {
          const { fileUrl } = img;

          a.coverUrl = fileUrl;
          albumCollection[id].coverUrl = fileUrl;
          break;
        }
      }

      // Take the first image
      if (!a.coverUrl && images.length) {
        const { fileUrl } = images[0];

        a.coverUrl = fileUrl;
        albumCollection[id].coverUrl = fileUrl;
      }
    });
  });

  const artistObject = Object.entries(artistCollection)
    .map(([id, { name, url }]) => ({ id, name, url }))
    .reduce((acc: ArtistObject, artist) => {
      const { name } = artist;
      const label = name.charAt(0);

      return {
        ...acc,
        [label]: [...(acc[label] || []), artist],
      };
    }, {});

  return { artistCollection, albumCollection, audioCollection, imageCollection, artistObject };
};

const getUrl = (baseUrl: string, path: string, id: string): string => {
  return `${baseUrl}/${path}/${id}`;
};

export const getElectronUrl = (protocol: string, filepath: string) => {
  return path.join(protocol, filepath);
};

const isImage = (filename: string) => {
  return imageExts.some((e) => filename.toLowerCase().endsWith(e));
};

const isAlbumCoverImage = (albumName: string, img: ParsedPath): boolean => {
  return albumName.toLowerCase().includes(img.name.toLowerCase());
};

const isDefaultNameImage = (pic: string) => {
  const s = pic.toLowerCase();
  return s.includes("front") || s.includes("cover") || s.includes("_large") || s.includes("folder");
};
