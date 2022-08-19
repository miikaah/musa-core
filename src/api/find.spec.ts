import * as Scanner from "../scanner";
import { findRandom } from "./find";
import { getArtistAlbums } from "./artist";
import { getAlbumById } from "./album";
import { getAudioById } from "./audio";
import { artistCollectionFixture } from "../../fixtures/artist.fixture";
import { albumCollectionFixture } from "../../fixtures/album.fixture";
import { audioCollectionFixture, audioFixture } from "../../fixtures/audio.fixture";

jest.mock("./album");
jest.mock("./artist");
jest.mock("./audio");
jest.mocked(getAudioById).mockResolvedValue(audioFixture);

const artistId = "QWxhbWFhaWxtYW4gdmFzYXJhdA";
const audioId =
  "QWxhbWFhaWxtYW4gdmFzYXJhdC9WYXNhcmFhc2lhLzAxIC0gTWFtZWx1a2tpICYgTXVzdGEgTGVza2kubXAz";
// @ts-expect-error it ain't read-only silly
Scanner.artistsForFind = [{ ...artistCollectionFixture[artistId], id: artistId }];
// @ts-expect-error it ain't read-only silly
Scanner.albumsForFind = Object.entries(albumCollectionFixture).map(([k, v]) => ({ id: k, ...v }));
// @ts-expect-error it ain't read-only silly
Scanner.audiosForFind = [{ ...audioCollectionFixture[audioId], id: audioId }];
// @ts-expect-error it ain't read-only silly
Scanner.audioCollection = audioCollectionFixture;

describe("Find API tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("findRandom()", () => {
    it("should return random results", async () => {
      expect(await findRandom({})).toEqual({
        albums: expect.any(Array),
        artists: expect.any(Array),
        audios: expect.any(Array),
      });
      expect(getArtistAlbums).toHaveBeenCalled();
      expect(getAlbumById).toHaveBeenCalled();
      expect(getAudioById).toHaveBeenCalled();
    });
  });
});
