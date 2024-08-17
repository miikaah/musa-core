import { IAudioMetadata } from "music-metadata";

export type FormatMetadata = {
  bitrate: number;
  codec: string;
  codecProfile: string;
  container: string;
  duration: number;
  lossless: boolean;
  numberOfChannels: number;
  sampleRate: number;
  tagTypes: string[];
  tool: string;
  trackInfo: string[];
  trackPeakLevel: number | undefined;
};

export type CommonMetadata = {
  track: NumberOf;
  disk: NumberOf;
  album: string;
  year: number;
  date: string;
  replaygain_track_gain: ReplayGain;
  replaygain_track_peak: ReplayGain;
  replaygain_album_gain: ReplayGain;
  replaygain_album_peak: ReplayGain;
  title: string;
  artists: string[];
  artist: string;
  encodersettings: string;
  composer: string[];
  comment: string[];
  albumartist: string;
  genre: string[];
  movementIndex: unknown;
};

export type NumberOf = { no: string | number | null; of: string | number | null };
export type ReplayGain = { dB: number; ratio: number };

export type GetMetadataParams = {
  id: string;
  quiet?: boolean;
};

type MMAudioMetadataFormat = Omit<IAudioMetadata["format"], "trackPeakLevel"> & {
  trackPeakLevel?: number | null;
};

export type MMAudioMetadata = Omit<IAudioMetadata, "format"> & {
  format: MMAudioMetadataFormat;
};

export type Metadata = Partial<{
  track: NumberOf;
  disk: NumberOf;
  album: string;
  year: number | string;
  date: string;
  replayGainTrackGain: ReplayGain;
  replayGainTrackPeak: ReplayGain;
  replayGainAlbumGain: ReplayGain;
  replayGainAlbumPeak: ReplayGain;
  title: string;
  artists: string[];
  artist: string;
  encoderSettings: string;
  composer: string[];
  albumArtist: string;
  genre: string[];
  dynamicRange: string;
  dynamicRangeAlbum: string;
  comment: string[];
  bitrate: number;
  duration: number;
  sampleRate: number;
  codec: string;
  codecProfile: string;
  container: string;
  lossless: boolean;
  numberOfChannels: number;
  tagTypes: string[];
  tool: string;
}>;

export type Codec = "MP3" | "FLAC" | "VORBIS";

export type Tags = {
  artist: string;
  title: string;
  album: string;
  year: string;
  trackNumber: string;
  partOfSet: string;
  genre: string;
  composer: string;
  comment: {
    language: string;
    text: string;
  };
  userDefinedText: {
    description: string;
    value: string;
  }[];
};

export type TagsFlac = {
  artist: string;
  title: string;
  album: string;
  year: string;
  trackNumber: string;
  trackTotal: string;
  diskNumber: string;
  diskTotal: string;
  genre: string;
  composer: string;
  comment: string;
  [x: string]: string;
};
