import fs from "fs/promises";

import { stateFixture } from "../fixtures/state.fixture";
import { setState, getState } from "./fs-state";

jest.mock("fs/promises");

const origConsoleErrorFn = console.error;

describe("File system state tests", () => {
  beforeEach(() => {
    jest.mock("fs/promises");
    jest.mocked(fs.readFile).mockResolvedValue(JSON.stringify(stateFixture));
    console.error = () => undefined;
  });

  afterAll(() => {
    console.error = origConsoleErrorFn;
  });

  describe("setState()", () => {
    it("should call writeFile", async () => {
      await setState("foo.json", stateFixture);

      expect(fs.writeFile).toHaveBeenCalledTimes(1);
      expect(fs.writeFile).toHaveBeenCalledWith(expect.any(String), expect.any(String));
    });
  });

  describe("getState()", () => {
    it("should call readFile", async () => {
      const state = await getState("foo.json");

      expect(state).toEqual(stateFixture);
      expect(fs.readFile).toHaveBeenCalledTimes(1);
      expect(fs.readFile).toHaveBeenCalledWith(expect.any(String), { encoding: "utf-8" });
    });

    it("should return empty JSON object if readFile throws", async () => {
      (fs.readFile as jest.MockedFunction<typeof fs.readFile>).mockImplementationOnce(async () => {
        throw new Error("");
      });

      const state = await getState("foo.json");

      expect(state).toEqual({});
      expect(fs.readFile).toHaveBeenCalledTimes(1);
      expect(fs.readFile).toHaveBeenCalledWith(expect.any(String), { encoding: "utf-8" });
    });

    it("should return empty musicLibrarypath string if JSON.parse throws", async () => {
      const origJsonParse = JSON.parse;
      JSON.parse = jest.fn().mockImplementationOnce(() => {
        throw new Error("");
      });

      const state = await getState("foo.json");
      JSON.parse = origJsonParse;

      expect(state).toEqual({ musicLibraryPath: "" });
      expect(fs.readFile).toHaveBeenCalledTimes(1);
      expect(fs.readFile).toHaveBeenCalledWith(expect.any(String), { encoding: "utf-8" });
    });
  });
});
