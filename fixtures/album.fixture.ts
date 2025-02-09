import { AlbumWithFilesAndMetadata } from "../src/api/album.types";
import { DbAlbum } from "../src/db.types";
import { AlbumCollection } from "../src/mediaSeparator.types";

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
      coverUrl: "",
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
        comment: ["asd"],
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
    files: [
      {
        id: "QWxhbWFhaWxtYW4gdmFzYXJhdC9WYXNhcmFhc2lhLzAxIC0gTWFtZWx1a2tpICYgTXVzdGEgTGVza2kubXAz",
        name: "Mamelukki & Musta Leski",
        url: "http://100.95.164.23:4200/audio/QWxhbWFhaWxtYW4gdmFzYXJhdC9WYXNhcmFhc2lhLzAxIC0gTWFtZWx1a2tpICYgTXVzdGEgTGVza2kubXAz",
        fileUrl:
          "http://100.95.164.23:4200/file/QWxhbWFhaWxtYW4gdmFzYXJhdC9WYXNhcmFhc2lhLzAxIC0gTWFtZWx1a2tpICYgTXVzdGEgTGVza2kubXAz",
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
  },
  QWxhbWFhaWxtYW4gdmFzYXJhdC9LYcyIYcyIcm1lbGF1dGFrdW50YQ: {
    artistName: "Alamaailman vasarat",
    artistUrl: "http://100.95.164.23:4200/artist/QWxhbWFhaWxtYW4gdmFzYXJhdA",
    name: "Käärmelautakunta",
    files: [],
    images: [],
    coverUrl:
      "http://100.95.164.23:4200/file/QWxhbWFhaWxtYW4gdmFzYXJhdC9LYcyIYcyIcm1lbGF1dGFrdW50YS9LYcyIYcyIcm1lbGF1dGFrdW50YS5qcGc",
  },
};

export const albumWithFilesFixture: AlbumWithFilesAndMetadata = {
  name: "Vasaraasia",
  artistName: "Alamaailman vasarat",
  artistUrl: "http://100.95.164.23:4200/artist/QWxhbWFhaWxtYW4gdmFzYXJhdA",
  files: [
    {
      id: "TW90w7ZyaGVhZC9Nb3TDtnJoZWFkIC0gMjAwMiAtIEhhbW1lcmVkICgxOTIpLzAxLW1vdG9yaGVhZC13YWxrX2FfY3Jvb2tlZF9taWxlLWFwYy5tcDM",
      name: "Walk A Crooked Mile",
      track: "01",
      url: "",
      fileUrl:
        "media:/Motörhead/Motörhead - 2002 - Hammered (192)/01-motorhead-walk_a_crooked_mile-apc.mp3",
      metadata: {
        track: {
          no: 1,
          of: 13,
        },
        disk: {
          no: null,
          of: null,
        },
        album: "Hammered",
        year: 2002,
        date: "2002",
        title: "Walk A Crooked Mile",
        artists: [],
        artist: "Motörhead",
        genre: [],
        comment: [],
        bitrate: 192000,
        duration: 353.0710204081633,
        container: "MPEG",
        codec: "MPEG 1 Layer 3",
        codecProfile: "CBR",
        lossless: false,
        numberOfChannels: 2,
        tool: "LAME 3.91UU",
        sampleRate: 44100,
        tagTypes: [],
        dynamicRange: "7",
        dynamicRangeAlbum: "7",
      },
      coverUrl: "media:/Motörhead/Motörhead - 2002 - Hammered (192)/Hammered.jpg",
    },
    {
      id: "TW90w7ZyaGVhZC9Nb3TDtnJoZWFkIC0gMjAwMiAtIEhhbW1lcmVkICgxOTIpLzAyLW1vdG9yaGVhZC1kb3duX3RoZV9saW5lLWFwYy5tcDM",
      name: "Down the Line",
      track: "02",
      url: "",
      fileUrl:
        "media:/Motörhead/Motörhead - 2002 - Hammered (192)/02-motorhead-down_the_line-apc.mp3",
      metadata: {
        track: {
          no: 2,
          of: 13,
        },
        disk: {
          no: null,
          of: null,
        },
        album: "Hammered",
        year: 2002,
        date: "2002",
        title: "Down the Line",
        artists: [],
        artist: "Motörhead",
        genre: [],
        comment: [],
        bitrate: 192000,
        duration: 265.7959183673469,
        container: "MPEG",
        codec: "MPEG 1 Layer 3",
        codecProfile: "CBR",
        lossless: false,
        numberOfChannels: 2,
        tool: "LAME 3.91UU",
        sampleRate: 44100,
        tagTypes: [],
        dynamicRange: "7",
        dynamicRangeAlbum: "7",
      },
      coverUrl: "media:/Motörhead/Motörhead - 2002 - Hammered (192)/Hammered.jpg",
    },
    {
      id: "TW90w7ZyaGVhZC9Nb3TDtnJoZWFkIC0gMjAwMiAtIEhhbW1lcmVkICgxOTIpLzIwMDIgSEFNTUVSRUQgQk9OVVMgRElTQyAoMTkyKS9Nb3TDtnJoZWFkIC0gMDEgLSBTaG9vdCBZb3UgSW4gVGhlIEJhY2subXAz",
      name: "Shoot You In The Back",
      track: "2.01",
      url: "",
      fileUrl:
        "media:/Motörhead/Motörhead - 2002 - Hammered (192)/2002 HAMMERED BONUS DISC (192)/Motörhead - 01 - Shoot You In The Back.mp3",
      metadata: {
        track: {
          no: 1,
          of: 3,
        },
        disk: {
          no: 2,
          of: null,
        },
        album: "Hammered",
        year: 2002,
        date: "2002",
        title: "Shoot You In The Back",
        artists: [],
        artist: "Motörhead",
        genre: [],
        bitrate: 192000,
        duration: 172.01632653061225,
        container: "MPEG",
        codec: "MPEG 1 Layer 3",
        codecProfile: "CBR",
        lossless: false,
        numberOfChannels: 2,
        tool: "LAME 3.92UU",
        sampleRate: 44100,
        tagTypes: [],
        dynamicRange: "7",
        dynamicRangeAlbum: "7",
      },
      coverUrl: "media:/Motörhead/Motörhead - 2002 - Hammered (192)/Hammered.jpg",
    },
    {
      id: "TW90w7ZyaGVhZC9Nb3TDtnJoZWFkIC0gMjAwMiAtIEhhbW1lcmVkICgxOTIpLzAzLW1vdG9yaGVhZC1icmF2ZV9uZXdfd29ybGQtYXBjLm1wMw",
      name: "Brave New World",
      track: "03",
      url: "",
      fileUrl:
        "media:/Motörhead/Motörhead - 2002 - Hammered (192)/03-motorhead-brave_new_world-apc.mp3",
      metadata: {
        track: {
          no: 3,
          of: 13,
        },
        disk: {
          no: null,
          of: null,
        },
        album: "Hammered",
        year: 2002,
        date: "2002",
        title: "Brave New World",
        artists: [],
        artist: "Motörhead",
        genre: [],
        comment: [],
        bitrate: 192000,
        duration: 245.1069387755102,
        container: "MPEG",
        codec: "MPEG 1 Layer 3",
        codecProfile: "CBR",
        lossless: false,
        numberOfChannels: 2,
        tool: "LAME 3.91UU",
        sampleRate: 44100,
        tagTypes: [],
        dynamicRange: "6",
        dynamicRangeAlbum: "7",
      },
      coverUrl: "media:/Motörhead/Motörhead - 2002 - Hammered (192)/Hammered.jpg",
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
