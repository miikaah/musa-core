import { AlbumCollection } from "../src/media-separator.types";
import { DbAlbum } from "../src/db.types";
import { AlbumWithFilesAndMetadata } from "../src/api/album.types";

export const albumDbFixture: DbAlbum = {
  path_id: "foo",
  modified_at: "2022-06-07T08:54:54.590Z",
  metadata: {
    year: 2000,
    album: "Vasaraasia",
    artists: ["Alamaailman Vasarat"],
    artist: "Alamaailman Vasarat",
    genre: ["Alternative"],
    dynamicRangeAlbum: "10",
  },
};

export const albumFixture: AlbumWithFilesAndMetadata = {
  name: "Vasaraasia",
  artistName: "Alamaailman vasarat",
  artistUrl: "http://100.95.164.23:4200/artist/QWxhbWFhaWxtYW4gdmFzYXJhdA",
  files: [
    {
      id: "QWxhbWFhaWxtYW4gdmFzYXJhdC9WYXNhcmFhc2lhLzAxIC0gTWFtZWx1a2tpICYgTXVzdGEgTGVza2kubXAz",
      name: "Mamelukki & Musta Leski",
      track: "01",
      url: "http://100.95.164.23:4200/audio/QWxhbWFhaWxtYW4gdmFzYXJhdC9WYXNhcmFhc2lhLzAxIC0gTWFtZWx1a2tpICYgTXVzdGEgTGVza2kubXAz",
      fileUrl:
        "http://100.95.164.23:4200/file/QWxhbWFhaWxtYW4gdmFzYXJhdC9WYXNhcmFhc2lhLzAxIC0gTWFtZWx1a2tpICYgTXVzdGEgTGVza2kubXAz",
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
    },
  ],
  images: [
    {
      id: "QWxhbWFhaWxtYW4gdmFzYXJhdC9WYXNhcmFhc2lhL1Zhc2FyYWFzaWEuanBn",
      name: "Vasaraasia.jpg",
      url: "http://100.95.164.23:4200/image/QWxhbWFhaWxtYW4gdmFzYXJhdC9WYXNhcmFhc2lhL1Zhc2FyYWFzaWEuanBn",
      fileUrl:
        "http://100.95.164.23:4200/file/QWxhbWFhaWxtYW4gdmFzYXJhdC9WYXNhcmFhc2lhL1Zhc2FyYWFzaWEuanBn",
    },
  ],
  coverUrl:
    "http://100.95.164.23:4200/file/QWxhbWFhaWxtYW4gdmFzYXJhdC9WYXNhcmFhc2lhL1Zhc2FyYWFzaWEuanBn",
  id: "QWxhbWFhaWxtYW4gdmFzYXJhdC9WYXNhcmFhc2lh",
  metadata: {
    year: 2000,
    album: "Vasaraasia",
    artists: ["Alamaailman Vasarat"],
    artist: "Alamaailman Vasarat",
    genre: ["Alternative"],
    dynamicRangeAlbum: "10",
  },
};

export const albumCollectionFixture: AlbumCollection = {
  QWxhbWFhaWxtYW4gdmFzYXJhdC9WYXNhcmFhc2lh: {
    artistName: "Alamaailman vasarat",
    artistUrl: "http://100.95.164.23:4200/artist/QWxhbWFhaWxtYW4gdmFzYXJhdA",
    name: "Vasaraasia",
    files: [],
    images: [
      {
        id: "QWxhbWFhaWxtYW4gdmFzYXJhdC9WYXNhcmFhc2lhL1Zhc2FyYWFzaWEuanBn",
        name: "Vasaraasia.jpg",
        url: "http://100.95.164.23:4200/image/QWxhbWFhaWxtYW4gdmFzYXJhdC9WYXNhcmFhc2lhL1Zhc2FyYWFzaWEuanBn",
        fileUrl:
          "http://100.95.164.23:4200/file/QWxhbWFhaWxtYW4gdmFzYXJhdC9WYXNhcmFhc2lhL1Zhc2FyYWFzaWEuanBn",
      },
    ],
    coverUrl:
      "http://100.95.164.23:4200/file/QWxhbWFhaWxtYW4gdmFzYXJhdC9WYXNhcmFhc2lhL1Zhc2FyYWFzaWEuanBn",
  },
};
