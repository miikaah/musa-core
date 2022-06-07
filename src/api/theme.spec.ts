import * as Db from "../db";
import { getAllThemes, getTheme, insertTheme, removeTheme } from "./theme";
import { themeFixture, themeDbFixture } from "../../fixtures/theme.fixture";

jest.mock("../db");
(Db.getAllThemes as jest.MockedFunction<typeof Db.getAllThemes>).mockResolvedValue([
  themeDbFixture,
]);
(Db.getTheme as jest.MockedFunction<typeof Db.getTheme>).mockResolvedValue(themeDbFixture);
(Db.insertTheme as jest.MockedFunction<typeof Db.insertTheme>).mockResolvedValue(themeDbFixture);

describe("Audio API tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAllThemes()", () => {
    it("should return themes", async () => {
      const theme = await getAllThemes();

      expect(theme).toEqual([themeFixture]);
      expect(Db.getAllThemes).toHaveBeenCalledTimes(1);
    });

    it("should throw if Db.getAllThemes throws", async () => {
      (Db.getAllThemes as jest.MockedFunction<typeof Db.getAllThemes>).mockImplementationOnce(
        async () => {
          throw new Error("err");
        }
      );

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
    });

    it("should return empty object if theme does not exist", async () => {
      (Db.getTheme as jest.MockedFunction<typeof Db.getTheme>).mockResolvedValue(undefined);

      await expect(getTheme(id)).rejects.toThrow("Theme Not Found");
      expect(Db.getTheme).toHaveBeenCalledTimes(1);
    });

    it("should throw if Db.getTheme throws", async () => {
      (Db.getTheme as jest.MockedFunction<typeof Db.getTheme>).mockImplementationOnce(async () => {
        throw new Error("err");
      });

      await expect(getTheme(id)).rejects.toThrow("err");
      expect(Db.getTheme).toHaveBeenCalledTimes(1);
    });
  });

  describe("insertTheme()", () => {
    const id = "QWxhbWFhaWxtYW4gdmFzYXJhdC9WYXNhcmFhc2lhL1Zhc2FyYWFzaWEuanBn";

    it("should return theme", async () => {
      const theme = await insertTheme(id, themeFixture.colors);

      expect(theme).toEqual(themeFixture);
      expect(Db.insertTheme).toHaveBeenCalledTimes(1);
    });

    it("should throw if Db.insertTheme throws", async () => {
      (Db.insertTheme as jest.MockedFunction<typeof Db.insertTheme>).mockImplementationOnce(
        async () => {
          throw new Error("err");
        }
      );

      await expect(insertTheme(id, themeFixture.colors)).rejects.toThrow("err");
      expect(Db.insertTheme).toHaveBeenCalledTimes(1);
    });
  });

  describe("removeTheme()", () => {
    const id = "QWxhbWFhaWxtYW4gdmFzYXJhdC9WYXNhcmFhc2lhL1Zhc2FyYWFzaWEuanBn";

    it("should call Db.removeTheme", async () => {
      const theme = await removeTheme(id);

      expect(theme).toEqual(undefined);
      expect(Db.removeTheme).toHaveBeenCalledTimes(1);
    });

    it("should throw if Db.removeTheme throws", async () => {
      (Db.removeTheme as jest.MockedFunction<typeof Db.removeTheme>).mockImplementationOnce(
        async () => {
          throw new Error("err");
        }
      );

      await expect(removeTheme(id)).rejects.toThrow("err");
      expect(Db.removeTheme).toHaveBeenCalledTimes(1);
    });
  });
});
