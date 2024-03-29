import { themeDbFixture, themeFixture } from "../../fixtures/theme.fixture";
import * as Db from "../db";
import { getAllThemes, getTheme, insertTheme, removeTheme } from "./theme";

vi.mock("../db");

describe("Audio API tests", () => {
  beforeAll(() => {
    vi.mocked(Db.getAllThemes).mockResolvedValue([themeDbFixture]);
    vi.mocked(Db.getTheme).mockResolvedValue(themeDbFixture);
    vi.mocked(Db.insertTheme).mockResolvedValue(themeDbFixture);
  });

  describe("getAllThemes()", () => {
    it("should return themes", async () => {
      const theme = await getAllThemes();

      expect(theme).toEqual([themeFixture]);
      expect(Db.getAllThemes).toHaveBeenCalledTimes(1);
    });

    it("should throw if Db.getAllThemes throws", async () => {
      vi.mocked(Db.getAllThemes).mockImplementationOnce(async () => {
        throw new Error("err");
      });

      await expect(getAllThemes()).rejects.toThrow("err");
      expect(Db.getAllThemes).toHaveBeenCalledTimes(1);
    });
  });

  describe("getTheme()", () => {
    const id = "QWxhbWFhaWxtYW4gdmFzYXJhdC9WYXNhcmFhc2lhL1Zhc2FyYWFzaWEuanBn";

    it("should return theme", async () => {
      const theme = await getTheme(id);

      expect(theme).toEqual(themeFixture);
      expect(Db.getTheme).toHaveBeenCalledTimes(1);
      expect(Db.getTheme).toHaveBeenCalledWith(id);
    });

    it("should return empty object if theme does not exist", async () => {
      vi.mocked(Db.getTheme).mockResolvedValue(undefined);

      await expect(getTheme(id)).rejects.toThrow("Theme Not Found");
      expect(Db.getTheme).toHaveBeenCalledTimes(1);
      expect(Db.getTheme).toHaveBeenCalledWith(id);
    });

    it("should throw if Db.getTheme throws", async () => {
      vi.mocked(Db.getTheme).mockImplementationOnce(async () => {
        throw new Error("err");
      });

      await expect(getTheme(id)).rejects.toThrow("err");
      expect(Db.getTheme).toHaveBeenCalledTimes(1);
      expect(Db.getTheme).toHaveBeenCalledWith(id);
    });
  });

  describe("insertTheme()", () => {
    const id = "QWxhbWFhaWxtYW4gdmFzYXJhdC9WYXNhcmFhc2lhL1Zhc2FyYWFzaWEuanBn";

    it("should return theme", async () => {
      const theme = await insertTheme(id, themeFixture.colors);

      expect(theme).toEqual(themeFixture);
      expect(Db.insertTheme).toHaveBeenCalledTimes(1);
      expect(Db.insertTheme).toHaveBeenCalledWith(id, themeFixture.colors);
    });

    it("should throw if Db.insertTheme throws", async () => {
      vi.mocked(Db.insertTheme).mockImplementationOnce(async () => {
        throw new Error("err");
      });

      await expect(insertTheme(id, themeFixture.colors)).rejects.toThrow("err");
      expect(Db.insertTheme).toHaveBeenCalledTimes(1);
      expect(Db.insertTheme).toHaveBeenCalledWith(id, themeFixture.colors);
    });
  });

  describe("removeTheme()", () => {
    const id = "QWxhbWFhaWxtYW4gdmFzYXJhdC9WYXNhcmFhc2lhL1Zhc2FyYWFzaWEuanBn";

    it("should call Db.removeTheme", async () => {
      const theme = await removeTheme(id);

      expect(theme).toEqual(undefined);
      expect(Db.removeTheme).toHaveBeenCalledTimes(1);
      expect(Db.removeTheme).toHaveBeenCalledWith(id);
    });

    it("should throw if Db.removeTheme throws", async () => {
      vi.mocked(Db.removeTheme).mockImplementationOnce(async () => {
        throw new Error("err");
      });

      await expect(removeTheme(id)).rejects.toThrow("err");
      expect(Db.removeTheme).toHaveBeenCalledTimes(1);
      expect(Db.removeTheme).toHaveBeenCalledWith(id);
    });
  });
});
