import { getAlbum, enrichAlbumFiles } from "../db";
import * as Scanner from "../scanner";
import { getAlbumById } from "./album";
import { albumDbFixture, albumFixture, albumCollectionFixture } from "../../fixtures/album.fixture";

jest.mock("../db");
jest.mocked(getAlbum).mockResolvedValue(albumDbFixture);
jest.mocked(enrichAlbumFiles).mockResolvedValue(albumFixture.files);

// @ts-expect-error it ain't read-only silly
Scanner.albumCollection = albumCollectionFixture;

describe("Album API tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAlbumById()", () => {
    const id = "QWxhbWFhaWxtYW4gdmFzYXJhdC9WYXNhcmFhc2lh";

    it("should return album", async () => {
      const album = await getAlbumById(id);

      expect(album).toEqual(albumFixture);
      expect(getAlbum).toHaveBeenCalledTimes(1);
      expect(getAlbum).toHaveBeenCalledWith(id);
      expect(enrichAlbumFiles).toHaveBeenCalledTimes(1);
      expect(enrichAlbumFiles).toHaveBeenCalledWith(albumCollectionFixture[id]);
    });

    it("should return empty object if album does not exist", async () => {
      const album = await getAlbumById("foo");

      expect(album).toEqual({});
      expect(getAlbum).toHaveBeenCalledTimes(0);
      expect(enrichAlbumFiles).toHaveBeenCalledTimes(0);
    });

    it("should throw if getAlbum throws", async () => {
      (getAlbum as jest.MockedFunction<typeof getAlbum>).mockImplementationOnce(async () => {
        throw new Error("err");
      });

      await expect(getAlbumById(id)).rejects.toThrow("err");
      expect(getAlbum).toHaveBeenCalledTimes(1);
      expect(enrichAlbumFiles).toHaveBeenCalledTimes(0);
    });
  });
});
