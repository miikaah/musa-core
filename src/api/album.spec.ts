import {
  albumCollectionFixture,
  albumDbFixture,
  albumFixture,
} from "../../fixtures/album.fixture";
import { enrichAlbumFiles, getAlbum } from "../db";
import { setPartialMediaCollectionForTest } from "../mediaCollection";
import { findAlbumById } from "./album";

vi.mock("../db");

describe("Album API tests", () => {
  beforeAll(() => {
    setPartialMediaCollectionForTest({
      albumCollection: albumCollectionFixture,
    });

    vi.mocked(getAlbum).mockResolvedValue(albumDbFixture);
    vi.mocked(enrichAlbumFiles).mockResolvedValue(albumFixture.files);
  });

  describe("getAlbumById", () => {
    const id = Object.keys(albumCollectionFixture)[0];

    it("returns album", async () => {
      const album = await findAlbumById(id);

      expect(album).toEqual(albumFixture);
      expect(getAlbum).toHaveBeenCalledTimes(1);
      expect(getAlbum).toHaveBeenCalledWith(id);
      expect(enrichAlbumFiles).toHaveBeenCalledTimes(1);
      expect(enrichAlbumFiles).toHaveBeenCalledWith(albumCollectionFixture[id]);
    });

    it("returns undefined if album not found", async () => {
      const album = await findAlbumById("foo");

      expect(album).toBe(undefined);
      expect(getAlbum).toHaveBeenCalledTimes(0);
      expect(enrichAlbumFiles).toHaveBeenCalledTimes(0);
    });

    it("throws if getAlbum throws", async () => {
      vi.mocked(getAlbum).mockImplementationOnce(async () => {
        throw new Error("err");
      });

      await expect(findAlbumById(id)).rejects.toThrow("err");
      expect(getAlbum).toHaveBeenCalledTimes(1);
      expect(enrichAlbumFiles).toHaveBeenCalledTimes(0);
    });
  });
});
