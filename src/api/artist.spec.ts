import { albumCollectionFixture } from "../../fixtures/album.fixture";
import {
  artistAlbumsFixture,
  artistCollectionFixture,
  artistFixture,
  artistObjectFixture,
} from "../../fixtures/artist.fixture";
import { audioDbFixture } from "../../fixtures/audio.fixture";
import { enrichAlbums, getAudio } from "../db";
import { setPartialMediaCollectionForTest } from "../mediaCollection";
import { getArtistAlbums, getArtistById, getArtists } from "./artist";

vi.mock("../db");

describe("Artist API tests", () => {
  beforeAll(() => {
    setPartialMediaCollectionForTest({
      artistCollection: artistCollectionFixture,
      albumCollection: albumCollectionFixture,
      artistObject: artistObjectFixture,
    });

    vi.mocked(getAudio).mockResolvedValue(audioDbFixture);
    vi.mocked(enrichAlbums).mockResolvedValue(artistAlbumsFixture.albums);
  });

  describe("getArtists", () => {
    it("should return audio", async () => {
      const artists = await getArtists();

      expect(artists).toEqual(artistObjectFixture);
    });
  });

  describe("getArtistById", () => {
    const id = Object.keys(artistCollectionFixture)[0];

    it("should return artist with albums sorted by year in ascending order", async () => {
      const artist = await getArtistById(id);

      expect(artist).toEqual(artistFixture);
      expect(artist.albums[0].year).toBe(null);
      expect(artist.albums[1].year).toBe(2000);
      expect(getAudio).toHaveBeenCalledTimes(1);
      expect(getAudio).toHaveBeenCalledWith(
        artistCollectionFixture[id].albums[0].firstAlbumAudio?.id,
      );
    });

    it("throws if artist not found", async () => {
      await expect(getArtistById("foo")).rejects.toThrow("Artist not found by id foo");
      expect(getAudio).toHaveBeenCalledTimes(0);
    });
  });

  describe("getArtistAlbums", () => {
    const id = "QWxhbWFhaWxtYW4gdmFzYXJhdA";

    it("should return artist's albums sorted by year in ascending order", async () => {
      const artist = await getArtistAlbums(id);

      expect(artist).toEqual(artistAlbumsFixture);
      expect(enrichAlbums).toHaveBeenCalledTimes(1);
      expect(enrichAlbums).toHaveBeenCalledWith(
        expect.any(Object),
        artistCollectionFixture[id],
      );
    });

    it("throws if artist not found", async () => {
      await expect(getArtistAlbums("foo")).rejects.toThrow("Artist not found by id foo");
      expect(enrichAlbums).toHaveBeenCalledTimes(0);
    });
  });
});
