export const artistObjectFixture = [
  {
    A: {
      id: "QWxhbWFhaWxtYW4gdmFzYXJhdA",
      name: "Alamaailman vasarat",
      url: "http://100.95.164.23:4200/artist/QWxhbWFhaWxtYW4gdmFzYXJhdA",
    },
  },
];

export const artistCollectionFixture = {
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
        year: 2000,
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
        year: 2003,
      },
    ],
    files: [],
    images: [],
  },
};

export const artistFixture = {
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

export const artistAlbumsFixture = {
  albums: [
    {
      coverUrl:
        "http://100.95.164.23:4200/file/QWxhbWFhaWxtYW4gdmFzYXJhdC9LYcyIYcyIcm1lbGF1dGFrdW50YS9LYcyIYcyIcm1lbGF1dGFrdW50YS5qcGc",
      id: "QWxhbWFhaWxtYW4gdmFzYXJhdC9LYcyIYcyIcm1lbGF1dGFrdW50YQ",
      name: "Käärmelautakunta",
      url: "http://100.95.164.23:4200/album/QWxhbWFhaWxtYW4gdmFzYXJhdC9LYcyIYcyIcm1lbGF1dGFrdW50YQ",
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
