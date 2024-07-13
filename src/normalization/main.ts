import path from "node:path";
import { Worker } from "node:worker_threads";
import { normalization } from "../requireAddon";

const createWorker = (channel: string, input: string) =>
  new Promise((resolve, reject) => {
    const worker = new Worker(path.resolve(__dirname, "./worker.js"));

    worker.on("message", (result) => {
      resolve(result);
      worker.terminate();
    });

    worker.on("error", (error) => {
      reject(error);
      worker.terminate();
    });

    worker.postMessage({ channel, input });
  });

type AddonResult = {
  error: {
    code: number;
    message: string;
  };
  block_list: number[];
  gain: number;
  dynamic_range_db: number;
  filepath: string;
  target_level_db: number;
  gain_db: number;
  sample_peak: number;
};

export const calculateLoudness = async (
  files: string[] = [],
): Promise<{
  albumGainDb: number;
  albumDynamicRangeDb: number;
  files: {
    filepath: string;
    targetLevelDb: number;
    gainDb: number;
    samplePeak: number;
    dynamicRangeDb: number;
  }[];
}> => {
  try {
    const results = (await Promise.all(
      files.map((input) => createWorker("calc_loudness", input)),
    )) as AddonResult[];
    const allBlockEnergies = results.flatMap((result) => result.block_list);
    const albumGain =
      files.length > 1
        ? normalization().calc_loudness_album(allBlockEnergies)
        : results.length > 0
          ? results[0].gain
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
        samplePeak: Number(result.sample_peak.toFixed(2)),
        dynamicRangeDb: Math.round(Math.abs(Number(result.dynamic_range_db.toFixed(2)))),
      })),
    };
  } catch (err) {
    console.error("Failed to calculate loudness:", err);
    throw err;
  }
};
