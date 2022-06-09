import fs from "fs/promises";
import { constants } from "fs";
import path from "path";

import { getMetadata } from "./metadata";
import {
  initDb,
  initTestDb,
  insertAudio,
  upsertAudio,
  getAudio,
  getAllAudios,
  getAudiosByIds,
  upsertAlbum,
  getAlbum,
  enrichAlbums,
  insertTheme,
  getAllThemes,
  getTheme,
  removeTheme,
} from "./db";
import UrlSafeBase64 from "./urlsafe-base64";
import { parsedMetadataFixture } from "../fixtures/metadata.fixture";
import { themeFixture } from "../fixtures/theme.fixture";
import { albumFixture, albumCollectionFixture } from "../fixtures/album.fixture";
import { artistCollectionFixture } from "../fixtures/artist.fixture";
import { audioFixture } from "../fixtures/audio.fixture";
import { enrichedAlbumsFixture } from "../fixtures/db.fixture";

jest.mock("./metadata");
(getMetadata as jest.MockedFunction<typeof getMetadata>).mockResolvedValue(parsedMetadataFixture);
jest.mock("./urlsafe-base64");
(UrlSafeBase64.decode as jest.MockedFunction<typeof UrlSafeBase64.decode>).mockReturnValue(
  "fakedecoded"
);
jest.mock("fs/promises", () => ({
  ...jest.requireActual("fs/promises"),
  stat: jest.fn().mockResolvedValue(<any>{
    mtimeMs: Date.now(),
  }),
}));

const libraryPath = "db-test-artifacts";
const audioDbPath = path.join(process.cwd(), libraryPath, ".musa.audio.v1.db");
const albumDbPath = path.join(process.cwd(), libraryPath, ".musa.album.v1.db");
const themeDbPath = path.join(process.cwd(), libraryPath, ".musa.theme.v2.db");
const fileExists = (file: string) => {
  return fs.access(file, constants.F_OK).then(
    () => true,
    () => false
  );
};

describe("DB tests", () => {
  describe("initDb()", () => {
    it("should initialize database and write persistent files to disk", async () => {
      await initDb(libraryPath);

      expect(await fileExists(audioDbPath)).toBe(true);
      expect(await fileExists(albumDbPath)).toBe(true);
      expect(await fileExists(themeDbPath)).toBe(true);

      await fs.rm(audioDbPath);
      await fs.rm(albumDbPath);
      await fs.rm(themeDbPath);

      expect(await fileExists(audioDbPath)).toBe(false);
      expect(await fileExists(albumDbPath)).toBe(false);
      expect(await fileExists(themeDbPath)).toBe(false);
    });
  });
});

describe("DB tests", () => {
  let testDbs;
  let audioDbInsertSpy: jest.SpyInstance;
  let audioDbUpdateSpy: jest.SpyInstance;
  let audioDbFindOneSpy: jest.SpyInstance;
  let audioDbFindSpy: jest.SpyInstance;
  let albumDbFindOneSpy: jest.SpyInstance;
  let albumDbInsertSpy: jest.SpyInstance;
  let albumDbUpdateSpy: jest.SpyInstance;
  let themeDbInsertSpy: jest.SpyInstance;
  let themeDbFindSpy: jest.SpyInstance;
  let themeDbFindOneSpy: jest.SpyInstance;
  let themeDbRemoveSpy: jest.SpyInstance;

  beforeAll(async () => {
    testDbs = await initTestDb(libraryPath);
    audioDbInsertSpy = jest.spyOn(testDbs.audioDb, "insertAsync");
    audioDbUpdateSpy = jest.spyOn(testDbs.audioDb, "updateAsync");
    audioDbFindOneSpy = jest.spyOn(testDbs.audioDb, "findOneAsync");
    audioDbFindSpy = jest.spyOn(testDbs.audioDb, "findAsync");
    albumDbFindOneSpy = jest.spyOn(testDbs.albumDb, "findOneAsync");
    albumDbInsertSpy = jest.spyOn(testDbs.albumDb, "insertAsync");
    albumDbUpdateSpy = jest.spyOn(testDbs.albumDb, "updateAsync");
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
    const id2 = id + "2";
    const filename2 = filename + "2";

    describe("insertAudio()", () => {
      it("should insert audio", async () => {
        await insertAudio({ id, filename });

        expect(getMetadata).toHaveBeenCalledTimes(1);
        expect(getMetadata).toHaveBeenCalledWith(libraryPath, {
          id,
          quiet: true,
        });
        expect(audioDbInsertSpy).toHaveBeenCalledTimes(1);
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

    describe("upsertAudio()", () => {
      it("should insert audio", async () => {
        await upsertAudio({ id: id2, filename: filename2, quiet: true });

        expect(getMetadata).toHaveBeenCalledTimes(1);
        expect(getMetadata).toHaveBeenCalledWith(libraryPath, {
          id: id2,
          quiet: true,
        });
        expect(audioDbInsertSpy).toHaveBeenCalledTimes(1);
        expect(audioDbInsertSpy).toHaveBeenCalledWith({
          filename: filename2,
          metadata: parsedMetadataFixture,
          modified_at: expect.any(String),
          path_id: id2,
        });
      });

      it("should update audio", async () => {
        (fs.stat as jest.MockedFunction<typeof fs.stat>).mockResolvedValue(<any>{
          mtimeMs: Date.now(),
        });

        await upsertAudio({ id: id2, filename: filename2, quiet: true });

        expect(getMetadata).toHaveBeenCalledTimes(1);
        expect(getMetadata).toHaveBeenCalledWith(libraryPath, {
          id: id2,
          quiet: true,
        });
        expect(audioDbUpdateSpy).toHaveBeenCalledTimes(1);
        expect(audioDbUpdateSpy).toHaveBeenCalledWith(
          { path_id: id2 },
          {
            $set: {
              filename: filename2,
              metadata: parsedMetadataFixture,
              modified_at: expect.any(String),
            },
          }
        );
      });

      it("should not update audio if it has not been modified", async () => {
        await upsertAudio({ id: id2, filename: filename2, quiet: true });

        expect(getMetadata).toHaveBeenCalledTimes(0);
        expect(audioDbUpdateSpy).toHaveBeenCalledTimes(0);
        expect(audioDbInsertSpy).toHaveBeenCalledTimes(0);
      });

      it("should early return if file is incompatible", async () => {
        await upsertAudio(<any>{});

        expect(audioDbFindOneSpy).toHaveBeenCalledTimes(0);
        expect(getMetadata).toHaveBeenCalledTimes(0);
        expect(audioDbInsertSpy).toHaveBeenCalledTimes(0);
        expect(audioDbUpdateSpy).toHaveBeenCalledTimes(0);
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
    const id = "QWxhbWFhaWxtYW4gdmFzYXJhdC9WYXNhcmFhc2lh";
    const album = {
      name: albumFixture.name,
      files: albumFixture.files,
    };
    const expectedAlbum = {
      filename: album.name,
      metadata: {
        album: "Ambiance",
        albumArtist: undefined,
        artist: "Miika Henttonen",
        artists: ["Miika Henttonen"],
        dynamicRangeAlbum: undefined,
        genre: undefined,
        year: 2017,
      },
      modified_at: expect.any(String),
      path_id: id,
    };

    describe("upsertAlbum()", () => {
      it("should insert album", async () => {
        albumDbFindOneSpy.mockResolvedValueOnce(null);

        await upsertAlbum({ id, album });

        expect(albumDbFindOneSpy).toHaveBeenCalledTimes(1);
        expect(albumDbInsertSpy).toHaveBeenCalledTimes(1);
        expect(albumDbInsertSpy).toHaveBeenCalledWith(expectedAlbum);
      });

      it("should update album", async () => {
        audioDbFindSpy.mockResolvedValueOnce([
          {
            filename: "foo",
            metadata: parsedMetadataFixture,
            modified_at: new Date().toISOString(),
            path_id: id,
          },
        ]);

        await upsertAlbum({ id, album });

        expect(albumDbFindOneSpy).toHaveBeenCalledTimes(1);
        expect(albumDbUpdateSpy).toHaveBeenCalledTimes(1);
        expect(albumDbUpdateSpy).toHaveBeenCalledWith({ path_id: id }, expectedAlbum);
      });

      it("should not update album if it has not been modified", async () => {
        audioDbFindSpy.mockResolvedValueOnce([
          {
            filename: "foo",
            metadata: parsedMetadataFixture,
            modified_at: "2022-06-08T12:23:40.520Z",
            path_id: id,
          },
        ]);

        await upsertAlbum({ id, album });

        expect(albumDbFindOneSpy).toHaveBeenCalledTimes(1);
        expect(albumDbInsertSpy).toHaveBeenCalledTimes(0);
        expect(albumDbUpdateSpy).toHaveBeenCalledTimes(0);
      });

      it("should early return if file is not passed in", async () => {
        await upsertAlbum(<any>undefined);

        expect(albumDbFindOneSpy).toHaveBeenCalledTimes(0);
        expect(albumDbInsertSpy).toHaveBeenCalledTimes(0);
        expect(albumDbUpdateSpy).toHaveBeenCalledTimes(0);
      });

      it("should early return if album has 0 files", async () => {
        audioDbFindSpy.mockResolvedValueOnce([]);

        await upsertAlbum({ id, album });

        expect(albumDbFindOneSpy).toHaveBeenCalledTimes(1);
        expect(albumDbInsertSpy).toHaveBeenCalledTimes(0);
        expect(albumDbUpdateSpy).toHaveBeenCalledTimes(0);
      });
    });

    describe("getAlbum()", () => {
      it("should get album", async () => {
        const album = await getAlbum(id);

        expect(album).toEqual({
          _id: expect.any(String),
          ...expectedAlbum,
        });
        expect(albumDbFindOneSpy).toHaveBeenCalledTimes(1);
        expect(albumDbFindOneSpy).toHaveBeenCalledWith({ path_id: id });
      });
    });

    describe("enrichAlbums()", () => {
      it("should enrich artist's albums and its files with metadata", async () => {
        audioDbFindSpy.mockResolvedValueOnce([audioFixture]);

        const albums = await enrichAlbums(
          albumCollectionFixture,
          artistCollectionFixture["QWxhbWFhaWxtYW4gdmFzYXJhdA"]
        );

        expect(albums).toEqual(enrichedAlbumsFixture);
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
