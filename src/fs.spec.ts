import { traverseFileSystem } from "./fs";

describe("fs", () => {
  describe("traverseFileSystem()", () => {
    it("should build a list of files in the given dir", async () => {
      const files = await traverseFileSystem(`${process.cwd()}/fixtures`);

      expect(files).toEqual([
        "artist/album/cover.JPG",
        "artist/album/song.mp3",
        "artist/image.PNG",
        "artist/song.mp3",
      ]);
    });
  });
});
