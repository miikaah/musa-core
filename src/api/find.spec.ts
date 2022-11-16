import { albumCollectionFixture } from "../../fixtures/album.fixture";
import { artistCollectionFixture } from "../../fixtures/artist.fixture";
import { audioCollectionFixture, audioFixture } from "../../fixtures/audio.fixture";
import { setPartialMediaCollectionForTest } from "../media-collection";
import { getAlbumById } from "./album";
import { getArtistAlbums } from "./artist";
import { getAudioById } from "./audio";
import { findRandom } from "./find";

jest.mock("./album");
jest.mock("./artist");
jest.mock("./audio");

describe("Find API tests", () => {
  beforeAll(() => {
    setPartialMediaCollectionForTest({
      artistCollection: artistCollectionFixture,
      albumCollection: albumCollectionFixture,
      audioCollection: audioCollectionFixture,
    });

    jest.mocked(getAudioById).mockResolvedValue(audioFixture);
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
