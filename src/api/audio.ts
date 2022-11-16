import fs from "fs/promises";
import path, { sep } from "path";

import { getAudio, getExternalAudio, insertExternalAudio, updateExternalAudio } from "../db";
import { audioExts, isDir, traverseFileSystem } from "../fs";
import { findAlbumInCollectionById, findAudioInCollectionById } from "../media-collection";
import { getElectronUrl } from "../media-separator";
import { getMetadataByFilepath } from "../metadata";
import UrlSafeBase64 from "../urlsafe-base64";

import { DbAudio } from "../db.types";
import { AudioReturnType } from "./audio.types";

export const getAudioById = async ({
  id,
  existingDbAudio,
}: {
  id: string;
  existingDbAudio?: DbAudio;
}): Promise<AudioReturnType> => {
  const audio = findAudioInCollectionById(id);

  if (!audio) {
    return {};
  }

  const album = findAlbumInCollectionById(audio.albumId);
  const dbAudio = existingDbAudio || (await getAudio(id));
  const name = dbAudio?.metadata?.title || audio.name;
  const trackNo = `${dbAudio?.metadata?.track?.no || ""}`;
  const diskNo = `${dbAudio?.metadata?.disk?.no || ""}`;
  const track = `${diskNo ? `${diskNo}.` : ""}${trackNo.padStart(2, "0")}`;

  return {
    ...audio,
    name,
    track: track === "00" ? null : track,
    fileUrl: audio.url,
    coverUrl: album?.coverUrl,
    metadata: dbAudio?.metadata,
  };
};

export const getAudiosByFilepaths = async (
  paths: string[],
  libPath: string,
  electronFileProtocol: string
): Promise<AudioReturnType[]> => {
  const audios = await Promise.all(
    paths.map((filepath) => handleDirOrFile(filepath, libPath, electronFileProtocol))
  );

  return (audios.flat(Infinity) as AudioReturnType[]).filter(hasKeys);
};

const handleDirOrFile = async (filepath: string, libPath: string, electronFileProtocol: string) => {
  const isExternal = !filepath.startsWith(libPath);

  if (isExternal) {
    if (isDir(filepath)) {
      const files = await traverseFileSystem(filepath);
      const filesWithFullPath = files.map((file) => path.join(filepath, file));

      return Promise.all(
        filesWithFullPath.map((file) => getAudioMetadata(file, electronFileProtocol))
      );
    }

    return getAudioMetadata(filepath, electronFileProtocol);
  }

  if (isDir(filepath)) {
    const files = await traverseFileSystem(filepath);
    const filesWithFullPath = files.map((file) => path.join(filepath, file));

    return Promise.all(filesWithFullPath.map((file) => getAudioByFilepath(file, libPath)));
  }

  return getAudioByFilepath(filepath, libPath);
};

const getAudioMetadata = async (filepath: string, electronFileProtocol: string) => {
  if (!audioExts.some((e) => filepath.toLowerCase().endsWith(e))) {
    return {};
  }
  const id = UrlSafeBase64.encode(filepath);
  const dbAudio = await getExternalAudio(id);
  const filenameParts = filepath.split(sep);
  const filename = filenameParts[filenameParts.length - 1];
  const { mtimeMs } = await fs.stat(filepath);

  let isUpdate = false;
  if (dbAudio) {
    if (Math.trunc(mtimeMs) <= new Date(dbAudio.modified_at).getTime()) {
      return {
        id,
        name: dbAudio?.metadata?.title || filename,
        track: dbAudio?.metadata?.track?.no,
        fileUrl: getElectronUrl(electronFileProtocol, filepath),
        coverUrl: null,
        metadata: dbAudio?.metadata,
      };
    }

    isUpdate = true;
  }

  const metadata = await getMetadataByFilepath(filepath);

  if (isUpdate) {
    await updateExternalAudio({ id, filename, metadata, modifiedAt: new Date(mtimeMs) });
  } else {
    await insertExternalAudio({ id, filename, filepath, metadata });
  }

  return {
    id,
    name: metadata.title || filename,
    track: metadata?.track?.no,
    fileUrl: getElectronUrl(electronFileProtocol, filepath),
    coverUrl: null,
    metadata,
  };
};

const getAudioByFilepath = (filepath: string, libPath: string) => {
  if (!audioExts.some((e) => filepath.toLowerCase().endsWith(e))) {
    return {};
  }
  const id = UrlSafeBase64.encode(filepath.replace(path.join(libPath, sep), ""));

  return getAudioById({ id });
};

const hasKeys = (obj: AudioReturnType) => {
  return Object.keys(obj).length > 0;
};
