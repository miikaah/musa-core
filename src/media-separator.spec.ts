import { createMediaCollection } from "./media-separator";

const fixture = [
  "artist/album/cover.JPG",
  "artist/album/song.mp3",
  "artist/image.PNG",
  "artist/song.mp3",
];

describe("Media Separator", () => {
  describe("createMediaCollection()", () => {
    it("should separate files to collections", async () => {
      expect(createMediaCollection({ files: fixture, baseUrl: "baseurl" })).toMatchSnapshot();
    });

    it("should separate files to collections for Electron", async () => {
      expect(
        createMediaCollection({ files: fixture, baseUrl: "baseurl", isElectron: true })
      ).toMatchSnapshot();
    });
  });
});
