import { ChildProcess } from "node:child_process";
import os from "node:os";
import {
  UtilityProcess as ElectronUtilityProcess,
  NormalizationError,
  NormalizationResult,
} from "../normalization.types";
import { normalization } from "../requireAddon";

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

type Task = {
  id: number;
  filepath: string;
  callback: (code: AddonResult | null, error?: Error) => void;
};

type ChildLikeProcess = ChildProcess | ElectronUtilityProcess;

type ForkFn = (modulePath: string) => ChildLikeProcess;

// Using a thread pool of child processes here because libsndfile uses libmpg123 internally,
// the combination of which doesn't work with worker threads. The issue is that the worker
// threads share memory of the main process which causes a threading issue with Apple ARM
// when calling the libmpg123 init function multiple times from the same process.
// A pointer of shared memory changes randomly during execution which causes autibsp check to fail
// in libsystem_platform.dylib.
//
// Ultimately it would be better to use ffmpeg libraries and a custom mutex with worker threads
// but this child process thread pool is good enough for v1. Another approach would be to isolate
// the needed parts from libsndfile to allow for calling the libmpg123 init function once per process
// but this might be more work than switching to ffmpeg libs.
class ThreadPool {
  maxPoolSize: number;
  workerScript: string;
  pool: any[];
  taskQueue: Task[];
  activeTasks: Map<number, { callback: Task["callback"]; worker: any }>;
  isExiting = false;

  constructor(maxPoolSize: number, workerScript: string, forkFn: ForkFn) {
    this.maxPoolSize = maxPoolSize;
    this.workerScript = workerScript;
    this.pool = [];
    this.taskQueue = [];
    this.activeTasks = new Map();

    for (let i = 0; i < this.maxPoolSize; i++) {
      const worker = forkFn(this.workerScript);
      worker.on("message", this.handleMessage.bind(this, worker));
      // @ts-expect-error Electron UtilityProcess does not emit the same events as node:child_process
      worker.on("exit", this.handleExit.bind(this, worker, forkFn));
      this.pool.push(worker);
    }
  }

  handleMessage(_worker: ChildLikeProcess, message: any) {
    const { id, error, result } = message;
    const { callback } = this.activeTasks.get(id) ?? {};

    if (callback) {
      callback(result, error);
      this.activeTasks.delete(id);
      this.processQueue();
    }
  }

  handleExit(worker: ChildLikeProcess, forkFn: ForkFn) {
    // console.log(`Worker ${worker.pid} exited`);
    if (this.isExiting) {
      return;
    }
    const index = this.pool.indexOf(worker);
    if (index !== -1) {
      const newWorker = forkFn(this.workerScript);
      newWorker.on("message", this.handleMessage.bind(this, newWorker));
      // @ts-expect-error Electron UtilityProcess does not emit the same events as node:child_process
      newWorker.on("exit", this.handleExit.bind(this, newWorker, forkFn));
      this.pool[index] = newWorker;
    }
  }

  execute(filepath: string, callback: Task["callback"]) {
    const id = Date.now() + Math.random();
    const worker = this.getAvailableWorker();

    if (worker) {
      this.activeTasks.set(id, { callback, worker });

      if (typeof worker.send === "function") {
        worker.send({ id, filepath });
      } else {
        worker.postMessage({ id, filepath });
      }
    } else {
      this.taskQueue.push({ id, filepath, callback });
    }
  }

  getAvailableWorker() {
    return this.pool.find(
      (worker) =>
        ![...this.activeTasks.values()].map(({ worker }) => worker).includes(worker),
    );
  }

  processQueue() {
    if (this.taskQueue.length > 0) {
      const { id, filepath, callback } = this.taskQueue.shift() ?? {};

      if (!id || !filepath || !callback) {
        return;
      }

      const worker = this.getAvailableWorker();
      if (worker) {
        this.activeTasks.set(id, { callback, worker });
        if (typeof worker.send === "function") {
          worker.send({ id, filepath });
        } else {
          worker.postMessage({ id, filepath });
        }
      } else {
        this.taskQueue.unshift({ id, filepath, callback });
      }
    }
  }

  killAll() {
    if (this.isExiting) {
      return;
    }
    console.log("Killing all child processes");
    this.isExiting = true;
    this.pool.forEach((worker) => worker.kill("SIGINT"));
  }
}

const exitSignals = ["SIGINT", "SIGTERM", "SIGHUP", "SIGQUIT"];

let pool: ThreadPool;

export const initNormalization = (forkFn: ForkFn, workerScript: string) => {
  if (pool) {
    console.warn("You should only call initNormalization once");
    return;
  }
  pool = new ThreadPool(os.cpus().length, workerScript, forkFn);

  const handleExit = (signal: string) => {
    console.log(`Got ${signal}. Terminating...`);
    pool.killAll();
    process.exit(0);
  };

  exitSignals.forEach((signal) => {
    process.on(signal, () => handleExit(signal));
  });
};

const runInWorker = (input: string) =>
  new Promise((resolve, reject) => {
    return pool.execute(input, (result, error) =>
      error ? reject(error) : resolve(result),
    );
  });

export const calculateLoudness = async (
  files: string[] = [],
): Promise<NormalizationResult> => {
  try {
    if (!pool) {
      throw new Error("Call initNormalization first");
    }
    const results = (await Promise.all(
      files.map((input) => runInWorker(input)),
    )) as AddonResult[];

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
