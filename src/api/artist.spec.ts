import { getAudio, enrichAlbums } from "../db";
import * as Scanner from "../scanner";
import { getArtists, getArtistById, getArtistAlbums } from "./artist";
import {
  artistObjectFixture,
  artistCollectionFixture,
  artistFixture,
  artistAlbumsFixture,
} from "../../fixtures/artist.fixture";
import { audioDbFixture } from "../../fixtures/audio.fixture";
import { albumCollectionFixture } from "../../fixtures/album.fixture";

jest.mock("../db");
// @ts-expect-error it ain't read-only silly
Scanner.artistObject = artistObjectFixture;
// @ts-expect-error it ain't read-only silly
Scanner.artistCollection = artistCollectionFixture;
// @ts-expect-error it ain't read-only silly
Scanner.albumCollection = albumCollectionFixture;

describe("Artist API tests", () => {
  beforeEach(() => {
    jest.mock("../db");
    jest.mocked(getAudio).mockResolvedValue(audioDbFixture);
    jest.mocked(enrichAlbums).mockResolvedValue(artistAlbumsFixture.albums);
  });

  describe("getArtists()", () => {
    it("should return audio", async () => {
      const artists = await getArtists();

      expect(artists).toEqual(artistObjectFixture);
    });
  });

  describe("getArtistById()", () => {
    const id = "QWxhbWFhaWxtYW4gdmFzYXJhdA";

    it("should return artist with albums sorted by year in ascending order", async () => {
      const artist = await getArtistById(id);

      expect(artist).toEqual(artistFixture);
      expect(artist.albums[0].year).toBe(null);
      expect(artist.albums[1].year).toBe(2000);
      expect(getAudio).toHaveBeenCalledTimes(1);
      expect(getAudio).toHaveBeenCalledWith(
        artistCollectionFixture[id].albums[0].firstAlbumAudio?.id
      );
    });

    it("should return empty object if artist does not exist", async () => {
      const artist = await getArtistById("foo");

      expect(artist).toEqual({});
      expect(getAudio).toHaveBeenCalledTimes(0);
    });

    it("should throw if getAudio throws", async () => {
      jest.mocked(getAudio).mockImplementationOnce(async () => {
        throw new Error("err");
      });

      await expect(getArtistById(id)).rejects.toThrow("err");
      expect(getAudio).toHaveBeenCalledTimes(1);
    });
  });

  describe("getArtistAlbums()", () => {
    const id = "QWxhbWFhaWxtYW4gdmFzYXJhdA";

    it("should return artist's albums sorted by year in ascending order", async () => {
      const artist = await getArtistAlbums(id);

      expect(artist).toEqual(artistAlbumsFixture);
      expect(enrichAlbums).toHaveBeenCalledTimes(1);
      expect(enrichAlbums).toHaveBeenCalledWith(expect.any(Object), artistCollectionFixture[id]);
    });

    it("should return empty object if artist does not exist", async () => {
      const artist = await getArtistAlbums("foo");

      expect(artist).toEqual({});
      expect(getAudio).toHaveBeenCalledTimes(0);
    });

    it("should throw if enrichAlbums throws", async () => {
      jest.mocked(enrichAlbums).mockImplementationOnce(async () => {
        throw new Error("err");
      });

      await expect(getArtistAlbums(id)).rejects.toThrow("err");
      expect(enrichAlbums).toHaveBeenCalledTimes(1);
    });
  });
});
