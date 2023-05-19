import path from "path";

import {
  mediaCollectionDarwinFixture,
  mediaCollectionElectronDarwinFixture,
  mediaCollectionElectronWin32Fixture,
  mediaCollectionWin32Fixture,
} from "../fixtures/mediaSeparator.fixture";
import { createMediaCollection } from "./mediaSeparator";

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
          createMediaCollection({
            files: fixture,
            baseUrl: "baseurl",
            isElectron: true,
            electronFileProtocol: "media://",
          })
        ).toEqual(mediaCollectionElectronWin32Fixture);
      } else {
        expect(
          createMediaCollection({
            files: fixture,
            baseUrl: "baseurl",
            isElectron: true,
            electronFileProtocol: "media://",
          })
        ).toEqual(mediaCollectionElectronDarwinFixture);
      }
    });
  });
});
