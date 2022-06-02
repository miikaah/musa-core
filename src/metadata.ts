import * as musicMetadata from "music-metadata";
import path from "path";

import UrlSafeBase64 from "./urlsafe-base64";
import type { AudioMetadata, GetMetadataParams, Metadata } from "./metadata.types";

export const readMetadata = async (filepath: string): Promise<AudioMetadata> => {
  let metadata = { format: {}, native: { "ID3v2.3": [] }, common: {} };

  try {
    // @ts-expect-error wrongly typed in music-metadata
    metadata = await musicMetadata.parseFile(filepath);
  } catch (error) {
    console.error("Error when reading music metadata", error);
  }

  return metadata;
};

export const getMetadata = async (
  libPath: string,
  { id, quiet = false }: GetMetadataParams
): Promise<Metadata> => {
  const audioPath = path.join(libPath, UrlSafeBase64.decode(id));
  const { format, native, common } = await readMetadata(audioPath);
  const id3v2x = native["ID3v2.4"] || native["ID3v2.3"] || native["ID3v1"] || [];
  const { vorbis = [] } = native;

  let dynamicRangeTags = {};
  if (id3v2x.length) {
    // mp3
    dynamicRangeTags = {
      dynamicRange: (id3v2x.find((tag) => tag.id === "TXXX:DYNAMIC RANGE") || {}).value,
      dynamicRangeAlbum: (id3v2x.find((tag) => tag.id === "TXXX:ALBUM DYNAMIC RANGE") || {}).value,
    };
  } else if (vorbis.length) {
    // flac
    dynamicRangeTags = {
      dynamicRange: (vorbis.find((tag) => tag.id === "DYNAMIC RANGE") || {}).value,
      dynamicRangeAlbum: (vorbis.find((tag) => tag.id === "ALBUM DYNAMIC RANGE") || {}).value,
    };
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
    encodersettings: encoderSettings,
    genre,
    composer,
    albumartist: albumArtist,
    comment,
  } = common;
  const { bitrate, duration, sampleRate } = format;

  const metadata = {
    track,
    disk,
    album,
    year,
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
    duration,
    sampleRate,
    ...dynamicRangeTags,
  };

  return metadata;
};
