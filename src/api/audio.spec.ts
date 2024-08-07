import { albumCollectionFixture } from "../../fixtures/album.fixture";
import {
  audioCollectionFixture,
  audioDbFixture,
  audioFixture,
} from "../../fixtures/audio.fixture";
import { getAudio } from "../db";
import { setPartialMediaCollectionForTest } from "../mediaCollection";
import { findAudioById } from "./audio";

vi.mock("../db");

describe("Audio API tests", () => {
  beforeAll(() => {
    setPartialMediaCollectionForTest({
      audioCollection: audioCollectionFixture,
      albumCollection: albumCollectionFixture,
    });

    vi.mocked(getAudio).mockResolvedValue(audioDbFixture);
  });

  describe("findAudioById", () => {
    const id = Object.keys(audioCollectionFixture)[0];

    it("returns audio", async () => {
      const audio = await findAudioById({ id });

      expect(audio).toEqual(audioFixture);
      expect(getAudio).toHaveBeenCalledTimes(1);
      expect(getAudio).toHaveBeenCalledWith(id);
    });

    it("returns undefined if audio not found", async () => {
      const audio = await findAudioById({ id: "foo" });

      expect(audio).toBe(undefined);
      expect(getAudio).toHaveBeenCalledTimes(0);
    });

    it("throws if getAudio throws", async () => {
      vi.mocked(getAudio).mockImplementationOnce(async () => {
        throw new Error("err");
      });

      await expect(findAudioById({ id })).rejects.toThrow("err");
      expect(getAudio).toHaveBeenCalledTimes(1);
    });
  });
});
