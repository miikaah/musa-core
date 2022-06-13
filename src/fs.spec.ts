import path from "path";

import { traverseFileSystem } from "./fs";

describe("fs", () => {
  describe("traverseFileSystem()", () => {
    it("should build a list of files in the given dir", async () => {
      const files = await traverseFileSystem(`${process.cwd()}/fixtures`);

      expect(files).toEqual([
        path.join("artist", "album", "cover.JPG"),
        path.join("artist", "album", "song.mp3"),
        path.join("artist", "image.PNG"),
        path.join("artist", "song.mp3"),
      ]);
    });
  });
});
