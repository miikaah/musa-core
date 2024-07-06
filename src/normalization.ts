import { calculateLoudness } from "./normalization/main";

export type Unit = {
  album: string;
  files: string[];
};

export type Result = {
  albumGainDb: number;
  albumDynamicRangeDb: number;
  files: {
    filepath: string;
    targetLevelDb: number;
    gainDb: number;
    samplePeak: number;
    dynamicRangeDb: number;
  }[];
};

export type Results = Record<string, Result>;

export const normalizeMany = async (units: Unit[]): Promise<Results> => {
  // Iterating through synchronously to get maximum throughput per album.
  // The calculateLoudness function runs the tracks in parallel.
  const results: Results = {};
  for (const unit of units) {
    results[unit.album] = await calculateLoudness(unit.files);
  }

  return results;
};
