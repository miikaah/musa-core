export type FormatMetadata = {
  bitrate: number;
  duration: number;
  sampleRate: number;
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
  composer: string;
  comment: string;
  albumartist: string;
  genre: string[];
};

export type AudioMetadata = {
  format: Partial<FormatMetadata>;
  native: {
    ID3v1?: { id: string; value: string }[];
    "ID3v2.3"?: { id: string; value: string }[];
    "ID3v2.4"?: { id: string; value: string }[];
    vorbis?: { id: string; value: string }[];
  };
  common: Partial<CommonMetadata>;
};

export type NumberOf = { no: string | number | null; of: string | number | null };
export type ReplayGain = { dB: number; ratio: number };

export type GetMetadataParams = {
  id: string;
  quiet?: boolean;
};

export type Metadata = Partial<{
  track: NumberOf;
  disk: NumberOf;
  album: string;
  year: number;
  date: string;
  replayGainTrackGain: ReplayGain;
  replayGainTrackPeak: ReplayGain;
  replayGainAlbumGain: ReplayGain;
  replayGainAlbumPeak: ReplayGain;
  title: string;
  artists: string[];
  artist: string;
  encoderSettings: string;
  composer: string;
  albumArtist: string;
  genre: string[];
  dynamicRange: string;
  dynamicRangeAlbum: string;
  bitrate: number;
  duration: number;
  sampleRate: number;
}>;
