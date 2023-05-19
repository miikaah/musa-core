import { albumCollectionFixture } from "../../fixtures/album.fixture";
import { audioCollectionFixture, audioDbFixture, audioFixture } from "../../fixtures/audio.fixture";
import { getAudio } from "../db";
import { setPartialMediaCollectionForTest } from "../mediaCollection";
import { getAudioById } from "./audio";

jest.mock("../db");

describe("Audio API tests", () => {
  beforeAll(() => {
    setPartialMediaCollectionForTest({
      audioCollection: audioCollectionFixture,
      albumCollection: albumCollectionFixture,
    });

    jest.mocked(getAudio).mockResolvedValue(audioDbFixture);
  });

  describe("getAudioById()", () => {
    const id = Object.keys(audioCollectionFixture)[0];

    it("should return audio", async () => {
      const audio = await getAudioById({ id });

      expect(audio).toEqual(audioFixture);
      expect(getAudio).toHaveBeenCalledTimes(1);
      expect(getAudio).toHaveBeenCalledWith(id);
    });

    it("should return empty object if audio does not exist", async () => {
      const audio = await getAudioById({ id: "foo" });

      expect(audio).toEqual({});
      expect(getAudio).toHaveBeenCalledTimes(0);
    });

    it("should throw if getAudio throws", async () => {
      jest.mocked(getAudio).mockImplementationOnce(async () => {
        throw new Error("err");
      });

      await expect(getAudioById({ id })).rejects.toThrow("err");
      expect(getAudio).toHaveBeenCalledTimes(1);
    });
  });
});
