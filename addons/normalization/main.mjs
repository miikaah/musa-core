import path from "node:path";
import { Worker } from "node:worker_threads";
import { normalization } from "./requireAddon.mjs";

const createWorker = (channel, input) =>
  new Promise((resolve, reject) => {
    const worker = new Worker(path.resolve(import.meta.dirname, "worker.mjs"));

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

/**
 * Calculates the loudness of audio files with EBU R128 algorithm.
 * @param {string[]} [files] - Array of audio files.
 * @returns {Promise<{
 *   albumGainDb: number;
 *   albumDynamicRangeDb: number;
 *   files: {
 *     filepath: string;
 *     targetLevelDb: number;
 *     gainDb: number;
 *     samplePeak: number;
 *     dynamicRangeDb: number;
 * }[];
 * }>} - A promise that resolves to an object.
 */
export const calculateLoudness = async (files = []) => {
  try {
    const results = await Promise.all(
      files.map((input) => createWorker("calc_loudness", input)),
    );
    const allBlockEnergies = results.flatMap((result) => result.block_list);
    const albumGain =
      files.length > 1
        ? normalization.calc_loudness_album(allBlockEnergies)
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
