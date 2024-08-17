import type { IAudioMetadata } from "music-metadata";
import type { Metadata } from "../src/metadata.types";

export const metadataFixture: Partial<IAudioMetadata> = {
  format: {
    bitrate: 320000,
    codec: "MPEG 1 Layer 3",
    codecProfile: "CBR",
    container: "MPEG",
    duration: 4.048979591836734,
    lossless: false,
    numberOfChannels: 2,
    sampleRate: 44100,
    tagTypes: ["ID3v2.3"],
    tool: "LAME 3.98r",
    trackInfo: [],
    trackPeakLevel: undefined,
  },
  native: {
    "ID3v2.3": [
      {
        id: "TRCK",
        value: "1",
      },
      {
        id: "TPOS",
        value: "1",
      },
      {
        id: "TIT2",
        value: "Palovaroitin FX",
      },
      {
        id: "TALB",
        value: "Ambiance",
      },
      {
        id: "TYER",
        value: "2017",
      },
      {
        id: "TPE1",
        value: "Miika Henttonen",
      },
    ],
  },
  common: {
    album: "Ambiance",
    artist: "Miika Henttonen",
    artists: ["Miika Henttonen"],
    disk: {
      no: 1,
      of: null,
    },
    movementIndex: {
      no: 1,
      of: null,
    },
    title: "Palovaroitin FX",
    track: {
      no: 1,
      of: null,
    },
    year: 2017,
  },
};

export const parsedMetadataFixture: Metadata = {
  album: "Ambiance",
  albumArtist: undefined,
  artist: "Miika Henttonen",
  artists: ["Miika Henttonen"],
  bitrate: 320000,
  codec: "MPEG 1 Layer 3",
  codecProfile: "CBR",
  comment: undefined,
  composer: undefined,
  container: "MPEG",
  date: undefined,
  disk: {
    no: 1,
    of: null,
  },
  duration: 4.048979591836734,
  dynamicRange: undefined,
  dynamicRangeAlbum: undefined,
  encoderSettings: undefined,
  genre: undefined,
  lossless: false,
  numberOfChannels: 2,
  replayGainAlbumGain: undefined,
  replayGainAlbumPeak: undefined,
  replayGainTrackGain: undefined,
  replayGainTrackPeak: undefined,
  sampleRate: 44100,
  tagTypes: ["ID3v2.3"],
  title: "Palovaroitin FX",
  tool: "LAME 3.98r",
  track: {
    no: 1,
    of: null,
  },
  year: 2017,
};
