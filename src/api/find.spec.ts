import { albumCollectionFixture } from "../../fixtures/album.fixture";
import { artistCollectionFixture } from "../../fixtures/artist.fixture";
import { audioCollectionFixture, audioFixture } from "../../fixtures/audio.fixture";
import { setPartialMediaCollectionForTest } from "../mediaCollection";
import { findAlbumById } from "./album";
import { getArtistAlbums } from "./artist";
import { findAudioById } from "./audio";
import { findRandom } from "./find";

vi.mock("./album");
vi.mock("./artist");
vi.mock("./audio");

describe("Find API tests", () => {
  beforeAll(() => {
    setPartialMediaCollectionForTest({
      artistCollection: artistCollectionFixture,
      albumCollection: albumCollectionFixture,
      audioCollection: audioCollectionFixture,
    });

    vi.mocked(findAudioById).mockResolvedValue(audioFixture);
  });

  describe("findRandom()", () => {
    it("should return random results", async () => {
      expect(await findRandom({})).toEqual({
        albums: expect.any(Array),
        artists: expect.any(Array),
        audios: expect.any(Array),
      });
      expect(getArtistAlbums).toHaveBeenCalled();
      expect(findAlbumById).toHaveBeenCalled();
      expect(findAudioById).toHaveBeenCalled();
    });
  });
});
