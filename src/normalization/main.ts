import path from "node:path";
import { Worker } from "node:worker_threads";
import { NormalizationError, NormalizationResult } from "../normalization.types";
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
  error: NormalizationError;
  block_list: number[];
  dynamic_range_db: number;
  filepath: string;
  target_level_db: number;
  gain_db: number;
  sample_peak: number;
  sample_peak_db: number;
};

export const calculateLoudness = async (
  files: string[] = [],
): Promise<NormalizationResult> => {
  try {
    console.log("\n\n\n-----------------------------");
    console.log("|            NEW RUN        |");
    console.log("-----------------------------\n");
    const results = (await Promise.all(
      files.map((input) => createWorker("calc_loudness", input)),
    )) as AddonResult[];
    console.log("\n-----------------------------");
    console.log("|            END RUN        |");
    console.log("-----------------------------\n\n\n");

    let hasError = false;
    for (const result of results) {
      if (result.error.code) {
        hasError = true;
        break;
      }
    }
    if (hasError) {
      return {
        files: results.map((result) => ({
          error: result.error,
          filepath: result.filepath,
        })),
      };
    }

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
