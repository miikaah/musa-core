import path, { sep } from "path";
import { getAudio } from "../db";
import { albumCollection, audioCollection } from "../scanner";
import UrlSafeBase64 from "../urlsafe-base64";
import { traverseFileSystem, isDir } from "../fs";

import { DbAudio } from "../db.types";
import { AudioReturnType } from "./audio.types";

export const getAudioById = async ({
  id,
  existingDbAudio,
}: {
  id: string;
  existingDbAudio?: DbAudio;
}): Promise<AudioReturnType> => {
  const audio = audioCollection[id];

  if (!audio) {
    return {};
  }

  const album = albumCollection[audio.albumId as string];
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
  libPath: string
): Promise<AudioReturnType[]> => {
  const audios = await Promise.all(paths.map((filepath) => handleDirOrFile(filepath, libPath)));

  return (audios.flat(Infinity) as AudioReturnType[]).filter(hasKeys);
};

const handleDirOrFile = async (filepath: string, libPath: string) => {
  if (isDir(filepath)) {
    const files = await traverseFileSystem(filepath);
    const filesWithFullPath = files.map((file) => path.join(filepath, file));

    return Promise.all(filesWithFullPath.map((file) => getAudioByFilepath(file, libPath)));
  }

  return getAudioByFilepath(filepath, libPath);
};

const getAudioByFilepath = (filepath: string, libPath: string) => {
  const id = UrlSafeBase64.encode(filepath.replace(path.join(libPath, sep), ""));

  return getAudioById({ id });
};

const hasKeys = (obj: AudioReturnType) => {
  return Object.keys(obj).length > 0;
};
