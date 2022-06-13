import path from "path";

import {
  mediaCollectionWin32Fixture,
  mediaCollectionDarwinFixture,
  mediaCollectionElectronWin32Fixture,
  mediaCollectionElectronDarwinFixture,
} from "../fixtures/media-separator.fixture";
import { createMediaCollection } from "./media-separator";

const fixture = [
  path.join("artist", "album", "cover.JPG"),
  path.join("artist", "album", "song.mp3"),
  path.join("artist", "image.PNG"),
  path.join("artist", "song.mp3"),
];

describe("Media Separator", () => {
  describe("createMediaCollection()", () => {
    it("should separate files to collections", async () => {
      if (process.platform === "win32") {
        expect(createMediaCollection({ files: fixture, baseUrl: "baseurl" })).toEqual(
          mediaCollectionWin32Fixture
        );
      } else {
        expect(createMediaCollection({ files: fixture, baseUrl: "baseurl" })).toEqual(
          mediaCollectionDarwinFixture
        );
      }
    });

    it("should separate files to collections for Electron", async () => {
      if (process.platform === "win32") {
        expect(
          createMediaCollection({ files: fixture, baseUrl: "baseurl", isElectron: true })
        ).toEqual(mediaCollectionElectronWin32Fixture);
      } else {
        expect(
          createMediaCollection({ files: fixture, baseUrl: "baseurl", isElectron: true })
        ).toEqual(mediaCollectionElectronDarwinFixture);
      }
    });
  });
});
