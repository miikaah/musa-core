import { EnrichedAlbum } from "../src/db.types";

export const enrichedAlbumsFixture: EnrichedAlbum[] = [
  {
    coverUrl:
      "http://100.95.164.23:4200/file/QWxhbWFhaWxtYW4gdmFzYXJhdC9WYXNhcmFhc2lhL1Zhc2FyYWFzaWEuanBn",
    files: [
      {
        coverUrl:
          "http://100.95.164.23:4200/file/QWxhbWFhaWxtYW4gdmFzYXJhdC9WYXNhcmFhc2lhL1Zhc2FyYWFzaWEuanBn",
        fileUrl:
          "http://100.95.164.23:4200/file/QWxhbWFhaWxtYW4gdmFzYXJhdC9WYXNhcmFhc2lhLzAxIC0gTWFtZWx1a2tpICYgTXVzdGEgTGVza2kubXAz",
        id: "QWxhbWFhaWxtYW4gdmFzYXJhdC9WYXNhcmFhc2lhLzAxIC0gTWFtZWx1a2tpICYgTXVzdGEgTGVza2kubXAz",
        metadata: {
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
          disk: { no: 1, of: null },
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
          track: { no: 1, of: null },
          year: 2017,
        },
        name: "Palovaroitin FX",
        track: "1.01",
        url: "http://100.95.164.23:4200/audio/QWxhbWFhaWxtYW4gdmFzYXJhdC9WYXNhcmFhc2lhLzAxIC0gTWFtZWx1a2tpICYgTXVzdGEgTGVza2kubXAz",
      },
    ],
    id: "QWxhbWFhaWxtYW4gdmFzYXJhdC9WYXNhcmFhc2lh",
    name: "Ambiance",
    url: "http://100.95.164.23:4200/album/QWxhbWFhaWxtYW4gdmFzYXJhdC9WYXNhcmFhc2lh",
    year: 2017,
  },
  {
    coverUrl:
      "http://100.95.164.23:4200/file/QWxhbWFhaWxtYW4gdmFzYXJhdC9LYcyIYcyIcm1lbGF1dGFrdW50YS9LYcyIYcyIcm1lbGF1dGFrdW50YS5qcGc",
    files: [],
    id: "QWxhbWFhaWxtYW4gdmFzYXJhdC9LYcyIYcyIcm1lbGF1dGFrdW50YQ",
    name: "Käärmelautakunta",
    url: "http://100.95.164.23:4200/album/QWxhbWFhaWxtYW4gdmFzYXJhdC9LYcyIYcyIcm1lbGF1dGFrdW50YQ",
    year: undefined,
  },
];
