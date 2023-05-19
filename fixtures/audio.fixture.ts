import { AudioWithMetadata } from "../src/api/audio.types";
import { DbAudio } from "../src/db.types";
import { FileCollection } from "../src/mediaSeparator.types";

export const audioFixture: AudioWithMetadata = {
  id: "QWxhbWFhaWxtYW4gdmFzYXJhdC9WYXNhcmFhc2lhLzAxIC0gTWFtZWx1a2tpICYgTXVzdGEgTGVza2kubXAz",
  name: "Mamelukki & Musta Leski",
  artistName: "Alamaailman vasarat",
  artistUrl: "http://100.95.164.23:4200/artist/QWxhbWFhaWxtYW4gdmFzYXJhdA",
  albumId: "QWxhbWFhaWxtYW4gdmFzYXJhdC9WYXNhcmFhc2lh",
  albumName: "Vasaraasia",
  albumUrl: "http://100.95.164.23:4200/album/QWxhbWFhaWxtYW4gdmFzYXJhdC9WYXNhcmFhc2lh",
  url: "http://100.95.164.23:4200/file/QWxhbWFhaWxtYW4gdmFzYXJhdC9WYXNhcmFhc2lhLzAxIC0gTWFtZWx1a2tpICYgTXVzdGEgTGVza2kubXAz",
  track: "01",
  fileUrl:
    "http://100.95.164.23:4200/file/QWxhbWFhaWxtYW4gdmFzYXJhdC9WYXNhcmFhc2lhLzAxIC0gTWFtZWx1a2tpICYgTXVzdGEgTGVza2kubXAz",
  coverUrl:
    "http://100.95.164.23:4200/file/QWxhbWFhaWxtYW4gdmFzYXJhdC9WYXNhcmFhc2lhL1Zhc2FyYWFzaWEuanBn",
  metadata: {
    track: {
      no: 1,
      of: 13,
    },
    disk: {
      no: null,
      of: null,
    },
    album: "Vasaraasia",
    year: 2000,
    replayGainTrackGain: {
      dB: -7.25,
      ratio: 0.18836490894898006,
    },
    replayGainTrackPeak: {
      dB: 0.3119267739283451,
      ratio: 1.074466,
    },
    title: "Mamelukki & Musta Leski",
    artists: ["Alamaailman Vasarat"],
    artist: "Alamaailman Vasarat",
    encoderSettings:
      "Audiograbber 1.83.01, LAME dll 3.99, 320 Kbit/s, Joint Stereo, Normal quality",
    genre: ["Alternative"],
    bitrate: 320000,
    duration: 165.82530612244898,
    sampleRate: 44100,
    dynamicRange: "9",
    dynamicRangeAlbum: "10",
  },
};

export const audioDbFixture: DbAudio = {
  path_id: "foo",
  modified_at: "2022-06-07T08:54:54.590Z",
  filename: "bar",
  metadata: audioFixture.metadata,
};

export const audioCollectionFixture: FileCollection = {
  QWxhbWFhaWxtYW4gdmFzYXJhdC9WYXNhcmFhc2lhLzAxIC0gTWFtZWx1a2tpICYgTXVzdGEgTGVza2kubXAz: {
    id: "QWxhbWFhaWxtYW4gdmFzYXJhdC9WYXNhcmFhc2lhLzAxIC0gTWFtZWx1a2tpICYgTXVzdGEgTGVza2kubXAz",
    name: "Mamelukki & Musta Leski",
    url: "http://100.95.164.23:4200/file/QWxhbWFhaWxtYW4gdmFzYXJhdC9WYXNhcmFhc2lhLzAxIC0gTWFtZWx1a2tpICYgTXVzdGEgTGVza2kubXAz",
    fileUrl:
      "http://100.95.164.23:4200/file/QWxhbWFhaWxtYW4gdmFzYXJhdC9WYXNhcmFhc2lhLzAxIC0gTWFtZWx1a2tpICYgTXVzdGEgTGVza2kubXAz",
    artistName: "Alamaailman vasarat",
    artistUrl: "http://100.95.164.23:4200/artist/QWxhbWFhaWxtYW4gdmFzYXJhdA",
    albumId: "QWxhbWFhaWxtYW4gdmFzYXJhdC9WYXNhcmFhc2lh",
    albumName: "Vasaraasia",
    albumUrl: "http://100.95.164.23:4200/album/QWxhbWFhaWxtYW4gdmFzYXJhdC9WYXNhcmFhc2lh",
  },
};
