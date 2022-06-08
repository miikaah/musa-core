import { getMetadata } from "./metadata";
import {
  initTestDb,
  insertAudio,
  getAudio,
  getAllAudios,
  getAudiosByIds,
  getAlbum,
  insertTheme,
  getAllThemes,
  getTheme,
  removeTheme,
} from "./db";
import UrlSafeBase64 from "./urlsafe-base64";
import { parsedMetadataFixture } from "../fixtures/metadata.fixture";
import { themeFixture } from "../fixtures/theme.fixture";

jest.mock("./metadata");
(getMetadata as jest.MockedFunction<typeof getMetadata>).mockResolvedValue(parsedMetadataFixture);
jest.mock("./urlsafe-base64");
(UrlSafeBase64.decode as jest.MockedFunction<typeof UrlSafeBase64.decode>).mockReturnValue(
  "fakedecoded"
);

describe("DB tests", () => {
  let testDbs;
  let audioDbInsertSpy: jest.SpyInstance;
  let audioDbFindOneSpy: jest.SpyInstance;
  let audioDbFindSpy: jest.SpyInstance;
  let albumDbFindOneSpy: jest.SpyInstance;
  let themeDbInsertSpy: jest.SpyInstance;
  let themeDbFindSpy: jest.SpyInstance;
  let themeDbFindOneSpy: jest.SpyInstance;
  let themeDbRemoveSpy: jest.SpyInstance;

  beforeAll(() => {
    testDbs = initTestDb();
    audioDbInsertSpy = jest.spyOn(testDbs.audioDb, "insertAsync");
    audioDbFindOneSpy = jest.spyOn(testDbs.audioDb, "findOneAsync");
    audioDbFindSpy = jest.spyOn(testDbs.audioDb, "findAsync");
    albumDbFindOneSpy = jest.spyOn(testDbs.albumDb, "findOneAsync");
    themeDbInsertSpy = jest.spyOn(testDbs.themeDb, "insertAsync");
    themeDbFindSpy = jest.spyOn(testDbs.themeDb, "findAsync");
    themeDbFindOneSpy = jest.spyOn(testDbs.themeDb, "findOneAsync");
    themeDbRemoveSpy = jest.spyOn(testDbs.themeDb, "removeAsync");
  });

  afterAll(() => {
    testDbs = null;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // NOTE: Order matters
  describe("Audio", () => {
    const id =
      "QWxhbWFhaWxtYW4gdmFzYXJhdC9WYXNhcmFhc2lhLzAxIC0gTWFtZWx1a2tpICYgTXVzdGEgTGVza2kubXAz";
    const filename = "foo";

    describe("insertAudio()", () => {
      it("should insert audio", async () => {
        await insertAudio({ id, filename });
        await insertAudio({ id: id + "2", filename: filename + "2" });

        expect(getMetadata).toHaveBeenCalledTimes(2);
        expect(getMetadata).toHaveBeenCalledWith("db-tests", {
          id,
          quiet: true,
        });
        expect(audioDbInsertSpy).toHaveBeenCalledTimes(2);
        expect(audioDbInsertSpy).toHaveBeenCalledWith({
          filename,
          metadata: parsedMetadataFixture,
          modified_at: expect.any(String),
          path_id: id,
        });
      });

      it("should early return if file is not passed in", async () => {
        await insertAudio(<any>null);

        expect(getMetadata).toHaveBeenCalledTimes(0);
        expect(audioDbInsertSpy).toHaveBeenCalledTimes(0);
      });
    });

    describe("getAudio()", () => {
      it("should get audio", async () => {
        const audio = await getAudio(id);

        expect(audio).toEqual({
          _id: expect.any(String),
          filename,
          metadata: parsedMetadataFixture,
          modified_at: expect.any(String),
          path_id: id,
        });
        expect(audioDbFindOneSpy).toHaveBeenCalledTimes(1);
        expect(audioDbFindOneSpy).toHaveBeenCalledWith({ path_id: id });
      });
    });

    describe("getAllAudios()", () => {
      it("should get all audios", async () => {
        const audios = await getAllAudios();

        expect(audios.sort((a, b) => a.path_id.length - b.path_id.length)).toEqual([
          {
            _id: expect.any(String),
            filename,
            metadata: parsedMetadataFixture,
            modified_at: expect.any(String),
            path_id: id,
          },
          {
            _id: expect.any(String),
            filename: filename + "2",
            metadata: parsedMetadataFixture,
            modified_at: expect.any(String),
            path_id: id + "2",
          },
        ]);
        expect(audioDbFindSpy).toHaveBeenCalledTimes(1);
        expect(audioDbFindSpy).toHaveBeenCalledWith({});
      });
    });

    describe("getAudiosByIds()", () => {
      it("should get audios by id", async () => {
        const audios = await getAudiosByIds([id, "foo"]);

        expect(audios).toEqual([
          {
            _id: expect.any(String),
            filename,
            metadata: parsedMetadataFixture,
            modified_at: expect.any(String),
            path_id: id,
          },
        ]);
        expect(audioDbFindSpy).toHaveBeenCalledTimes(1);
        expect(audioDbFindSpy).toHaveBeenCalledWith({
          path_id: {
            $in: [id, "foo"],
          },
        });
      });
    });
  });

  describe("Album", () => {
    // TODO: Proper test once there is a test for upsert
    describe("getAlbum()", () => {
      it("should get album", async () => {
        const id = "foo";
        const album = await getAlbum(id);

        expect(album).toEqual(null);
        expect(albumDbFindOneSpy).toHaveBeenCalledTimes(1);
        expect(albumDbFindOneSpy).toHaveBeenCalledWith({ path_id: "foo" });
      });
    });
  });

  describe("Theme", () => {
    const { id, colors } = themeFixture;

    describe("insertTheme()", () => {
      it("should insert theme", async () => {
        const theme = await insertTheme(id, colors);
        await insertTheme(id + "2", colors);

        expect(theme).toEqual({
          _id: expect.any(String),
          colors,
          filename: "fakedecoded",
          modified_at: expect.any(String),
          path_id: id,
        });
        expect(themeDbInsertSpy).toHaveBeenCalledTimes(2);
        expect(themeDbInsertSpy).toHaveBeenCalledWith({
          _id: expect.any(String),
          colors,
          filename: "fakedecoded",
          modified_at: expect.any(String),
          path_id: id,
        });
      });
    });

    describe("getAllThemes()", () => {
      it("should get all themes", async () => {
        const themes = await getAllThemes();

        expect(themes.sort((a, b) => a.path_id.length - b.path_id.length)).toEqual([
          {
            _id: expect.any(String),
            colors,
            filename: "fakedecoded",
            modified_at: expect.any(String),
            path_id: id,
          },
          {
            _id: expect.any(String),
            colors,
            filename: "fakedecoded",
            modified_at: expect.any(String),
            path_id: id + "2",
          },
        ]);
        expect(themeDbFindSpy).toHaveBeenCalledTimes(1);
        expect(themeDbFindSpy).toHaveBeenCalledWith({});
      });
    });

    describe("getTheme()", () => {
      it("should get theme", async () => {
        const theme = await getTheme(id);

        expect(theme).toEqual({
          _id: expect.any(String),
          colors,
          filename: "fakedecoded",
          modified_at: expect.any(String),
          path_id: id,
        });
        expect(themeDbFindOneSpy).toHaveBeenCalledTimes(1);
        expect(themeDbFindOneSpy).toHaveBeenCalledWith({ path_id: id });
      });
    });

    describe("removeTheme()", () => {
      it("should remove theme", async () => {
        await removeTheme(id);
        await removeTheme(id + "2");

        expect(themeDbRemoveSpy).toHaveBeenCalledTimes(2);
        expect(themeDbRemoveSpy).toHaveBeenCalledWith({ _id: id }, {});
        expect(await getAllThemes()).toEqual([]);
      });
    });
  });
});
