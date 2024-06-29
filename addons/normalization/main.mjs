import { Worker } from "node:worker_threads";
import os from "node:os";
import path from "node:path";
import { normalization } from "./requireAddon.mjs";

class ThreadPool {
  constructor(size) {
    this.size = size;
    this.workers = [];
    this.availableWorkers = [];
    this.queue = [];

    for (let i = 0; i < size; i++) {
      const worker = new Worker(path.resolve(import.meta.dirname, "worker.mjs"));

      this.availableWorkers.push(worker);
      this.workers.push(worker);

      worker.on("message", (result) => {
        const { resolve } = worker.task;
        resolve(result);
        worker.task = null;
        this.availableWorkers.push(worker);
        this.runNext();
      });
    }
  }

  runNext() {
    if (this.queue.length > 0 && this.availableWorkers.length > 0) {
      const { channel, input, resolve, reject } = this.queue.shift();
      const worker = this.availableWorkers.shift();
      worker.task = { resolve, reject };
      worker.postMessage({ channel, input });
    }
  }

  runTask(channel, input) {
    return new Promise((resolve, reject) => {
      this.queue.push({ channel, input, resolve, reject });
      this.runNext();
    });
  }

  destroy() {
    for (const worker of this.workers) {
      worker.terminate();
    }
  }
}

const numThreads = os.cpus().length;
const threadPool = new ThreadPool(numThreads);

/**
 * Calculates the loudness of audio files with EBUR128 algorithm.
 * @param {any[]} [files] - Array of audio files.
 * @returns {Promise<{
 *   albumGain: number;
 *   files: {
 *     filepath: string;
 *     gain: number;
 * }[];
 * }>} - A promise that resolves to an object containing `albumGain` and `files` array.
 */
export const calculateLoudness = async (files = []) => {
  try {
    const results = await Promise.all(
      files.map((input) => threadPool.runTask("calc_loudness", input)),
    );
    const allBlockEnergies = results.flatMap((result) => result.block_list);
    const albumGain =
      files.length > 1
        ? normalization.calc_loudness_album(allBlockEnergies)
        : results.length > 0
          ? results[0].gain
          : 0;

    return {
      albumGain: Number(albumGain.toFixed(2)),
      files: results.map((result) => ({
        filepath: result.filepath,
        gain: Number(result.gain.toFixed(2)),
      })),
    };
  } catch (err) {
    console.error("Failed to calculate loudness:", err);
    throw err;
  } finally {
    threadPool.destroy();
  }
};
