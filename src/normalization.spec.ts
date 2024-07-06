import * as Normalization from "./normalization";
import { calculateLoudness } from "./normalization/main";

vi.mock("./normalization/main");

const units: Normalization.Unit[] = [
  {
    album: "album-1",
    files: ["filepath-1", "filepath-2"],
  },
  {
    album: "album-2",
    files: ["filepath-3"],
  },
];

const fileTemplate = {
  filepath: "",
  targetLevelDb: -18,
  gainDb: -10.01,
  samplePeak: 0.999,
  dynamicRangeDb: 8,
};

const albumTemplate: Normalization.Result = {
  albumGainDb: -5.67,
  albumDynamicRangeDb: 7,
  files: [],
};

const mockCalculateLoudness = vi
  .mocked(calculateLoudness)
  .mockImplementation(async (files) => ({
    ...albumTemplate,
    files: (files ?? []).map((filepath: string) => ({ ...fileTemplate, filepath })),
  }));

describe("normalization", () => {
  it("returns normalization result by album", async () => {
    const results = await Normalization.normalizeMany(units);

    expect(mockCalculateLoudness).toHaveBeenCalledWith(units[0].files);
    expect(mockCalculateLoudness).toHaveBeenCalledWith(units[1].files);
    expect(results).toMatchInlineSnapshot(`
      {
        "album-1": {
          "albumDynamicRangeDb": 7,
          "albumGainDb": -5.67,
          "files": [
            {
              "dynamicRangeDb": 8,
              "filepath": "filepath-1",
              "gainDb": -10.01,
              "samplePeak": 0.999,
              "targetLevelDb": -18,
            },
            {
              "dynamicRangeDb": 8,
              "filepath": "filepath-2",
              "gainDb": -10.01,
              "samplePeak": 0.999,
              "targetLevelDb": -18,
            },
          ],
        },
        "album-2": {
          "albumDynamicRangeDb": 7,
          "albumGainDb": -5.67,
          "files": [
            {
              "dynamicRangeDb": 8,
              "filepath": "filepath-3",
              "gainDb": -10.01,
              "samplePeak": 0.999,
              "targetLevelDb": -18,
            },
          ],
        },
      }
    `);
  });
});
