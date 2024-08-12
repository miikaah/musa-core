import { Artist, ArtistWithEnrichedAlbums } from "../src/api/artist.types";
import { ArtistCollection, ArtistObject } from "../src/mediaSeparator.types";

export const artistObjectFixture: ArtistObject = {
  A: [
    {
      id: "QWxhbWFhaWxtYW4gdmFzYXJhdA",
      name: "Alamaailman vasarat",
      url: "http://100.95.164.23:4200/artist/QWxhbWFhaWxtYW4gdmFzYXJhdA",
    },
  ],
};

export const artistCollectionFixture: ArtistCollection = {
  QWxhbWFhaWxtYW4gdmFzYXJhdA: {
    url: "http://100.95.164.23:4200/artist/QWxhbWFhaWxtYW4gdmFzYXJhdA",
    name: "Alamaailman vasarat",
    albums: [
      {
        id: "QWxhbWFhaWxtYW4gdmFzYXJhdC9WYXNhcmFhc2lh",
        name: "Vasaraasia",
        url: "http://100.95.164.23:4200/album/QWxhbWFhaWxtYW4gdmFzYXJhdC9WYXNhcmFhc2lh",
        coverUrl:
          "http://100.95.164.23:4200/file/QWxhbWFhaWxtYW4gdmFzYXJhdC9WYXNhcmFhc2lhL1Zhc2FyYWFzaWEuanBn",
        firstAlbumAudio: {
          id: "QWxhbWFhaWxtYW4gdmFzYXJhdC9WYXNhcmFhc2lhLzAxIC0gTWFtZWx1a2tpICYgTXVzdGEgTGVza2kubXAz",
          name: "foo",
        },
      },
      {
        id: "QWxhbWFhaWxtYW4gdmFzYXJhdC9LYcyIYcyIcm1lbGF1dGFrdW50YQ",
        name: "Käärmelautakunta",
        url: "http://100.95.164.23:4200/album/QWxhbWFhaWxtYW4gdmFzYXJhdC9LYcyIYcyIcm1lbGF1dGFrdW50YQ",
        coverUrl:
          "http://100.95.164.23:4200/file/QWxhbWFhaWxtYW4gdmFzYXJhdC9LYcyIYcyIcm1lbGF1dGFrdW50YS9LYcyIYcyIcm1lbGF1dGFrdW50YS5qcGc",
      },
    ],
    files: [],
    images: [],
  },
};

export const artistFixture: Artist = {
  albums: [
    {
      id: "QWxhbWFhaWxtYW4gdmFzYXJhdC9LYcyIYcyIcm1lbGF1dGFrdW50YQ",
      name: "Käärmelautakunta",
      url: "http://100.95.164.23:4200/album/QWxhbWFhaWxtYW4gdmFzYXJhdC9LYcyIYcyIcm1lbGF1dGFrdW50YQ",
      coverUrl:
        "http://100.95.164.23:4200/file/QWxhbWFhaWxtYW4gdmFzYXJhdC9LYcyIYcyIcm1lbGF1dGFrdW50YS9LYcyIYcyIcm1lbGF1dGFrdW50YS5qcGc",
      year: null,
    },
    {
      coverUrl:
        "http://100.95.164.23:4200/file/QWxhbWFhaWxtYW4gdmFzYXJhdC9WYXNhcmFhc2lhL1Zhc2FyYWFzaWEuanBn",
      id: "QWxhbWFhaWxtYW4gdmFzYXJhdC9WYXNhcmFhc2lh",
      name: "Vasaraasia",
      url: "http://100.95.164.23:4200/album/QWxhbWFhaWxtYW4gdmFzYXJhdC9WYXNhcmFhc2lh",
      year: 2000,
    },
  ],
  files: [],
  images: [],
  name: "Alamaailman vasarat",
  url: "http://100.95.164.23:4200/artist/QWxhbWFhaWxtYW4gdmFzYXJhdA",
};

export const artistAlbumsFixture: ArtistWithEnrichedAlbums = {
  albums: [
    {
      coverUrl:
        "http://100.95.164.23:4200/file/QWxhbWFhaWxtYW4gdmFzYXJhdC9LYcyIYcyIcm1lbGF1dGFrdW50YS9LYcyIYcyIcm1lbGF1dGFrdW50YS5qcGc",
      id: "QWxhbWFhaWxtYW4gdmFzYXJhdC9LYcyIYcyIcm1lbGF1dGFrdW50YQ",
      name: "Käärmelautakunta",
      url: "http://100.95.164.23:4200/album/QWxhbWFhaWxtYW4gdmFzYXJhdC9LYcyIYcyIcm1lbGF1dGFrdW50YQ",
      year: undefined,
      files: [],
    },
    {
      coverUrl:
        "http://100.95.164.23:4200/file/QWxhbWFhaWxtYW4gdmFzYXJhdC9WYXNhcmFhc2lhL1Zhc2FyYWFzaWEuanBn",
      id: "QWxhbWFhaWxtYW4gdmFzYXJhdC9WYXNhcmFhc2lh",
      name: "Vasaraasia",
      url: "http://100.95.164.23:4200/album/QWxhbWFhaWxtYW4gdmFzYXJhdC9WYXNhcmFhc2lh",
      year: 2000,
      files: [],
    },
  ],
  files: [],
  images: [],
  name: "Alamaailman vasarat",
  url: "http://100.95.164.23:4200/artist/QWxhbWFhaWxtYW4gdmFzYXJhdA",
};
