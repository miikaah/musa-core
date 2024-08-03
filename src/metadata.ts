import fs from "fs/promises";
import Metaflac from "metaflac-js2";
import type { IAudioMetadata } from "music-metadata";
import NodeID3 from "node-id3";
import path from "path";
import * as Db from "./db";
import { isPathExternal } from "./fs";
import type {
  Codec,
  GetMetadataParams,
  Metadata,
  Tags,
  TagsFlac,
} from "./metadata.types";
import { getGlobalThreadPool, Message } from "./threadPool";
import UrlSafeBase64 from "./urlSafeBase64";

export const readMetadata = async (filepath: string): Promise<IAudioMetadata> => {
  try {
    const musicMetadata = await import("music-metadata");

    return await musicMetadata.parseFile(filepath);
  } catch (error) {
    console.error("Error when reading music metadata", error);
    throw error;
  }
};

export const getMetadata = async (
  libPath: string,
  { id, quiet = false }: GetMetadataParams,
): Promise<Metadata> => {
  const audioPath = path.join(libPath, UrlSafeBase64.decode(id));
  const tags = await readMetadata(audioPath);

  return getMetadataTags(audioPath, tags, quiet);
};

export const getMetadataByFilepath = async (filepath: string) => {
  const tags = await readMetadata(filepath);

  return getMetadataTags(filepath, tags, true);
};

const getMetadataTags = async (
  audioPath: string,
  tags: IAudioMetadata,
  quiet = false,
): Promise<Metadata> => {
  const { format, native, common } = tags;
  const id3v2x = [
    ...(native["ID3v2.4"] || []),
    ...(native["ID3v2.3"] || []),
    ...(native["ID3v1"] || []),
  ];
  const { vorbis = [] } = native;

  let dynamicRangeTags = {};
  let flacDate;
  if (id3v2x.length) {
    // mp3
    dynamicRangeTags = {
      dynamicRange: (id3v2x.find((tag) => tag.id === "TXXX:DYNAMIC RANGE") || {}).value,
      dynamicRangeAlbum: (
        id3v2x.find((tag) => tag.id === "TXXX:ALBUM DYNAMIC RANGE") || {}
      ).value,
    };
  }

  if (vorbis.length) {
    // flac, ogg
    dynamicRangeTags = {
      dynamicRange: (vorbis.find((tag) => tag.id === "DYNAMIC RANGE") || {}).value,
      dynamicRangeAlbum: (vorbis.find((tag) => tag.id === "ALBUM DYNAMIC RANGE") || {})
        .value,
    };

    flacDate = (vorbis.find((tag) => tag.id === "DATE") || {}).value;
  }

  if (!quiet) {
    console.log("format", format);
    console.log("native", native);
    console.log("common", common);
  }

  const {
    track,
    disk,
    album,
    year,
    date,
    replaygain_track_gain: replayGainTrackGain,
    replaygain_track_peak: replayGainTrackPeak,
    replaygain_album_gain: replayGainAlbumGain,
    replaygain_album_peak: replayGainAlbumPeak,
    title,
    artists,
    artist,
    encodedby,
    encodersettings: encoderSettings,
    genre,
    composer,
    albumartist: albumArtist,
    comment,
  } = common;

  const {
    bitrate,
    duration,
    sampleRate,
    tagTypes,
    lossless,
    container,
    codec,
    numberOfChannels,
    codecProfile,
    tool,
  } = format;

  let dur = 0;
  if (!duration && bitrate) {
    const stats = await fs.stat(audioPath);
    const { size } = stats;
    console.log(audioPath, "does not have duration field in format, calculating...");

    dur = size / (bitrate / 8);
  }

  const metadata = {
    track,
    disk,
    album,
    year: flacDate || year,
    date,
    replayGainTrackGain,
    replayGainTrackPeak,
    replayGainAlbumGain,
    replayGainAlbumPeak,
    title,
    artists,
    artist,
    encoderSettings,
    genre,
    composer,
    albumArtist,
    comment,
    bitrate,
    duration: duration || dur,
    container,
    codec,
    codecProfile,
    lossless,
    numberOfChannels,
    tool: tool || encodedby,
    sampleRate,
    tagTypes,
    ...dynamicRangeTags,
  };

  return metadata;
};

const getTypeOfCodec = (codec?: string): Codec => {
  if (!codec) {
    console.error("Unknown codec type. Can not update tags.");
    throw new Error("UNKNOWN_CODEC");
  }

  if (codec.toLowerCase().startsWith("mpeg")) {
    return "MP3";
  }
  if (codec.toLowerCase().startsWith("flac")) {
    return "FLAC";
  }
  // TODO: Check what the vorbis codec string actually is
  if (codec.toLowerCase().startsWith("vorbis")) {
    return "VORBIS";
  }

  console.error(`Unknown codec type ${codec}. Can not update tags.`);
  throw new Error("UNKNOWN_CODEC");
};

type WriteTagsResult = {
  isExternal: boolean;
  id: string;
  filename: string;
  metadata: Metadata;
};

export const writeTags = async (
  musicLibraryPath: string,
  id: string,
  tags: Partial<Tags>,
  isWorker?: boolean,
): Promise<WriteTagsResult> => {
  const filename = UrlSafeBase64.decode(id);
  const isExternal = isPathExternal(filename);
  const filepath = isExternal ? filename : path.join(musicLibraryPath, filename);
  const metadata = isExternal
    ? await getMetadataByFilepath(filename)
    : await getMetadata(musicLibraryPath, { id, quiet: true });
  const codec = getTypeOfCodec(metadata.codec);

  switch (codec) {
    case "MP3": {
      // @ts-expect-error the node-id3 package userDefinedText type is wrong
      NodeID3.update(tags, filepath);

      if (!isWorker) {
        await updateAudio({ isExternal, id, filename, metadata });
      }

      return { isExternal, id, filename, metadata };
    }
    case "FLAC": {
      const flac = new Metaflac(filepath);
      Object.values(parseTagsToFlacFormat(tags)).forEach((t) => {
        const [tagName] = (t ?? "").split("=");
        flac.removeTag(tagName);
        flac.setTag(t);
      });
      flac.save();

      if (!isWorker) {
        await updateAudio({ isExternal, id, filename, metadata });
      }

      return { isExternal, id, filename, metadata };
    }
    case "VORBIS": {
      throw new Error("Not implemented");
    }
    default:
      codec satisfies never;
      throw new Error(`Unsupported codec type ${codec}`);
  }
};

type Input = {
  musicLibraryPath: string;
  fid: string;
  tags: Partial<Tags>;
};

type Output = any;

export type MetadataMessage = Message<Input, "musa:metadata">;

const runInWorker = (data: Input) =>
  new Promise((resolve, reject) => {
    const id = Date.now() + Math.random();
    const callback = (result: Output, error?: Error) =>
      error ? reject(error) : resolve(result);
    const channel = "musa:metadata";

    getGlobalThreadPool<Input, Output>()?.execute({ id, callback, channel, data });
  });

export const writeTagsMany = async (
  musicLibraryPath: string,
  files: { fid: string; tags: Partial<Tags> }[],
): Promise<void> => {
  const results = (await Promise.all(
    files.map(({ fid, tags }) => {
      const pool = getGlobalThreadPool<Input, Output>();
      if (pool) {
        return runInWorker({ musicLibraryPath, fid, tags });
      } else {
        return writeTags(musicLibraryPath, fid, tags, false);
      }
    }),
  )) as WriteTagsResult[];

  // The db is a file on disk so can't be updated in parallel because there's no locking
  for (const result of results) {
    await updateAudio(result);
  }
};

const updateAudio = async ({
  isExternal,
  id,
  filename,
  metadata,
}: {
  isExternal: boolean;
  id: string;
  filename: string;
  metadata: Metadata;
}) => {
  if (isExternal) {
    await Db.updateExternalAudio({ id, filename, metadata, modifiedAt: new Date() });
  } else {
    await Db.updateAudio({
      id,
      filename,
      modifiedAt: new Date(),
    });
  }
};

const parseTagsToFlacFormat = (tags: Partial<Tags>) => {
  const flacTags: Partial<TagsFlac> = {};

  if (tags.artist) {
    flacTags.artist = `ARTIST=${tags.artist}`;
  }
  if (tags.title) {
    flacTags.title = `TITLE=${tags.title}`;
  }
  if (tags.album) {
    flacTags.album = `ALBUM=${tags.album}`;
  }
  if (tags.year) {
    flacTags.year = `DATE=${tags.year}`;
  }
  if (tags.trackNumber) {
    if (tags.trackNumber.includes("/")) {
      const [track, total] = tags.trackNumber.split("/");

      flacTags.trackNumber = `TRACKNUMBER=${track}`;
      flacTags.trackTotal = `TRACKTOTAL=${total}`;
    } else {
      flacTags.trackNumber = `TRACKNUMBER=${tags.trackNumber}`;
    }
  }
  if (tags.partOfSet) {
    if (tags.partOfSet.includes("/")) {
      const [disk, total] = tags.partOfSet.split("/");

      flacTags.diskNumber = `DISCNUMBER=${disk}`;
      flacTags.diskTotal = `DISCTOTAL=${total}`;
    } else {
      flacTags.diskNumber = `DISCNUMBER=${tags.partOfSet}`;
    }
  }
  if (tags.genre) {
    flacTags.genre = `GENRE=${tags.genre}`;
  }
  if (tags.composer) {
    flacTags.composer = `COMPOSER=${tags.composer}`;
  }
  if (tags.comment) {
    flacTags.comment = `COMMENT=${tags.comment.text}`;
  }
  if (Array.isArray(tags.userDefinedText) && tags.userDefinedText.length > 0) {
    for (const tag of tags.userDefinedText) {
      flacTags[tag.description] = `${tag.description}=${tag.value}`;
    }
  }

  return flacTags;
};
