import { getAudio } from "../db";
import * as Scanner from "../scanner";
import { getAudioById } from "./audio";
import { audioDbFixture, audioFixture, audioCollectionFixture } from "../../fixtures/audio.fixture";
import { albumCollectionFixture } from "../../fixtures/album.fixture";

jest.mock("../db");
// @ts-expect-error it ain't read-only silly
Scanner.audioCollection = audioCollectionFixture;
// @ts-expect-error it ain't read-only silly
Scanner.albumCollection = albumCollectionFixture;

describe("Audio API tests", () => {
  beforeEach(() => {
    jest.mock("../db");
    jest.mocked(getAudio).mockResolvedValue(audioDbFixture);
  });

  describe("getAudioById()", () => {
    const id =
      "QWxhbWFhaWxtYW4gdmFzYXJhdC9WYXNhcmFhc2lhLzAxIC0gTWFtZWx1a2tpICYgTXVzdGEgTGVza2kubXAz";

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
