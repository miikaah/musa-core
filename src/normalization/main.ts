import { NormalizationError, NormalizationResult } from "../normalization.types";
import { normalization } from "../requireAddon";
import { getGlobalThreadPool, hasThreadPool, Message } from "../threadPool";

type Input = {
  filepath: string;
};

type Output = {
  error: NormalizationError;
  block_list: number[];
  dynamic_range_db: number;
  filepath: string;
  target_level_db: number;
  gain_db: number;
  sample_peak: number;
  sample_peak_db: number;
};

export type NormalizationMessage = Message<Input, "musa:normalization">;

const runInWorker = (filepath: string) =>
  new Promise((resolve, reject) => {
    const id = Date.now() + Math.random();
    const callback = (result: Output, error?: Error) =>
      error ? reject(error) : resolve(result);
    const channel = "musa:normalization";
    const data = { filepath };

    getGlobalThreadPool<Input, Output>()?.execute({ id, callback, channel, data });
  });

export const calculateLoudness = async (
  files: string[] = [],
): Promise<NormalizationResult> => {
  try {
    if (!hasThreadPool()) {
      throw new Error("Call createThreadPool first");
    }
    const results = (await Promise.all(
      files.map((input) => runInWorker(input)),
    )) as Output[];

    const allBlockEnergies = results.flatMap((result) => result.block_list);
    const albumGain: number =
      files.length > 1
        ? normalization().calc_loudness_album(allBlockEnergies)
        : results.length > 0
          ? results[0].gain_db
          : 0;
    const albumDynamicRangeDb = Math.round(
      Math.abs(
        results.map((result) => result.dynamic_range_db).reduce((acc, v) => acc + v, 0) /
          results.length,
      ),
    );

    return {
      albumGainDb: Number(albumGain.toFixed(2)),
      albumDynamicRangeDb: Number(albumDynamicRangeDb.toFixed(2)),
      files: results.map((result) => ({
        error: result.error,
        filepath: result.filepath,
        targetLevelDb: Number(result.target_level_db.toFixed(2)),
        gainDb: Number(result.gain_db.toFixed(2)),
        samplePeak: Number(result.sample_peak.toFixed(5)),
        samplePeakDb: Number(result.sample_peak_db.toFixed(2)),
        dynamicRangeDb: Math.round(Math.abs(Number(result.dynamic_range_db.toFixed(2)))),
      })),
    };
  } catch (err) {
    console.error("Failed to calculate loudness:", err);
    throw err;
  }
};
