import path from "path";
import { metadataFixture, parsedMetadataFixture } from "../fixtures/metadata.fixture.js";
import { getMetadata, readMetadata } from "./metadata";
import UrlSafeBase64 from "./urlSafeBase64";

const origConsoleErrorFn = console.error;

describe("Metadata tests", () => {
  beforeAll(() => {
    console.error = () => undefined;
  });

  afterAll(() => {
    console.error = origConsoleErrorFn;
  });

  describe("readMetadata", () => {
    it("should return metadata from file", async () => {
      const metadata = await readMetadata(
        path.join(process.cwd(), "fixtures", "artist", "song.mp3"),
      );

      expect(metadata.format).toEqual(metadataFixture.format);
      expect(metadata.native).toEqual(metadataFixture.native);
      expect(metadata.common).toEqual(metadataFixture.common);
    });

    it("should throw when file does not exist", async () => {
      const filepath = path.join(process.cwd(), "fixtures", "artist", "foo.mp3");
      console.error = vi.fn();

      await expect(readMetadata(filepath)).rejects.toThrow();
    });
  });

  describe("getMetadata", () => {
    it("should return metadata from file", async () => {
      const metadata = await getMetadata(path.join(process.cwd(), "fixtures", "artist"), {
        id: UrlSafeBase64.encode("song.mp3"),
        quiet: true,
      });

      expect(metadata).toEqual(parsedMetadataFixture);
    });
  });
});
