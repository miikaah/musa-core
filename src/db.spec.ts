import { constants } from "fs";
import fs from "fs/promises";
import path from "path";
import type { SpyInstance } from "vitest";

import { albumCollectionFixture, albumFixture } from "../fixtures/album.fixture";
import { artistCollectionFixture } from "../fixtures/artist.fixture";
import { audioFixture } from "../fixtures/audio.fixture";
import { enrichedAlbumsFixture } from "../fixtures/db.fixture";
import { parsedMetadataFixture } from "../fixtures/metadata.fixture.js";
import { themeFixture } from "../fixtures/theme.fixture";
import {
  enrichAlbums,
  getAlbum,
  getAllAudios,
  getAllThemes,
  getAudio,
  getAudiosByIds,
  getTheme,
  initDb,
  initTestDb,
  insertAudio,
  insertTheme,
  removeTheme,
  updateAudio,
  upsertAlbum,
} from "./db";
import { getMetadata } from "./metadata";
import UrlSafeBase64 from "./urlSafeBase64";

vi.mock("./metadata");
vi.mock("./urlSafeBase64");
vi.mock("fs/promises", async () => ({
  ...(await vi.importActual<Record<string, unknown>>("fs/promises")),
  stat: vi.fn().mockResolvedValue(<any>{
    mtimeMs: Date.now(),
  }),
}));

const libraryPath = "dbTestArtifacts";
const audioDbPath = path.join(process.cwd(), libraryPath, ".musa.audio.v2.db");
const albumDbPath = path.join(process.cwd(), libraryPath, ".musa.album.v1.db");
const themeDbPath = path.join(process.cwd(), libraryPath, ".musa.theme.v2.db");
const fileExists = (file: string) => {
  return fs.access(file, constants.F_OK).then(
    () => true,
    () => false,
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
  let audioDbInsertSpy: SpyInstance;
  let audioDbUpdateSpy: SpyInstance;
  let audioDbFindOneSpy: SpyInstance;
  let audioDbFindSpy: SpyInstance;
  let albumDbFindOneSpy: SpyInstance;
  let albumDbUpdateSpy: SpyInstance;
  let themeDbInsertSpy: SpyInstance;
  let themeDbFindSpy: SpyInstance;
  let themeDbFindOneSpy: SpyInstance;
  let themeDbRemoveSpy: SpyInstance;

  beforeAll(async () => {
    testDbs = await initTestDb(libraryPath);
    audioDbInsertSpy = vi.spyOn(testDbs.audioDb, "insertAsync");
    audioDbUpdateSpy = vi.spyOn(testDbs.audioDb, "updateAsync");
    audioDbFindOneSpy = vi.spyOn(testDbs.audioDb, "findOneAsync");
    audioDbFindSpy = vi.spyOn(testDbs.audioDb, "findAsync");
    albumDbFindOneSpy = vi.spyOn(testDbs.albumDb, "findOneAsync");
    albumDbUpdateSpy = vi.spyOn(testDbs.albumDb, "updateAsync");
    themeDbInsertSpy = vi.spyOn(testDbs.themeDb, "insertAsync");
    themeDbFindSpy = vi.spyOn(testDbs.themeDb, "findAsync");
    themeDbFindOneSpy = vi.spyOn(testDbs.themeDb, "findOneAsync");
    themeDbRemoveSpy = vi.spyOn(testDbs.themeDb, "removeAsync");
  });

  beforeAll(() => {
    vi.mocked(getMetadata).mockResolvedValue(parsedMetadataFixture);
    vi.mocked(UrlSafeBase64.decode).mockReturnValue("fakedecoded");
  });

  afterAll(() => {
    testDbs = null;
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
        await insertAudio({ id: id2, filename: filename2 });

        expect(getMetadata).toHaveBeenCalledTimes(2);
        expect(getMetadata).toHaveBeenCalledWith(libraryPath, {
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

    describe("updateAudio()", () => {
      it("should update audio", async () => {
        await updateAudio({ id: id2, filename: filename2, modifiedAt: new Date() });

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
          },
        );
      });

      it("should early return if file is not passed in", async () => {
        await updateAudio(<any>null);

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
        await upsertAlbum({ id, album });

        expect(albumDbUpdateSpy).toHaveBeenCalledTimes(1);
        expect(albumDbUpdateSpy).toHaveBeenCalledWith({ path_id: id }, expectedAlbum, {
          upsert: true,
        });
      });

      it("should update album", async () => {
        await upsertAlbum({ id, album });

        expect(albumDbUpdateSpy).toHaveBeenCalledTimes(1);
        expect(albumDbUpdateSpy).toHaveBeenCalledWith({ path_id: id }, expectedAlbum, {
          upsert: true,
        });
      });

      it("should early return if file is not passed in", async () => {
        await upsertAlbum(<any>undefined);

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
          artistCollectionFixture["QWxhbWFhaWxtYW4gdmFzYXJhdA"],
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
