import { ChildProcess } from "node:child_process";
import os from "node:os";
import { UtilityProcess as ElectronUtilityProcess } from "./normalization.types";

type WorkerChannel = "musa:normalization" | "musa:metadata";

export type Task<Input, Output, Channel extends WorkerChannel> = {
  id: number;
  callback: (result: Output, error?: Error) => void;
  channel: Channel;
  data: Input;
};

export type Message<T, U extends WorkerChannel> = Omit<Task<T, any, U>, "callback">;

type WorkerResult = {
  id: number;
  error: Error;
  result: any;
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
export class ThreadPool<Input, Output> {
  maxPoolSize: number;
  workerScript: string;
  pool: any[];
  taskQueue: Task<Input, Output, WorkerChannel>[];
  activeTasks: Map<
    number,
    { callback: Task<Input, Output, WorkerChannel>["callback"]; worker: any }
  >;
  isExiting = false;

  constructor(maxPoolSize: number, workerScript: string, forkFn: ForkFn) {
    this.maxPoolSize = maxPoolSize;
    this.workerScript = workerScript;
    this.pool = [];
    this.taskQueue = [];
    this.activeTasks = new Map();

    // console.log("Thread pool worker", workerScript);
    for (let i = 0; i < this.maxPoolSize; i++) {
      const worker = forkFn(this.workerScript);
      worker.on("message", this.handleMessage.bind(this, worker));
      // @ts-expect-error Electron UtilityProcess does not emit the same events as node:child_process
      worker.on("exit", this.handleExit.bind(this, worker, forkFn));
      this.pool.push(worker);
    }
  }

  handleMessage(_worker: ChildLikeProcess, message: WorkerResult) {
    const { id, error, result } = message;
    const { callback } = this.activeTasks.get(id) ?? {};

    if (callback) {
      callback(result, error);
      this.activeTasks.delete(id);
      this.processQueue();
    }
  }

  handleExit(worker: ChildLikeProcess, forkFn: ForkFn) {
    if (this.isExiting) {
      console.log(`Worker ${worker.pid} exited`);
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

  execute(input: Task<Input, Output, WorkerChannel>) {
    const { id, data, channel, callback } = input;
    const message: Message<any, any> = { id, data, channel };

    const worker = this.getAvailableWorker();
    if (worker) {
      this.activeTasks.set(id, { callback, worker });

      if (typeof worker.send === "function") {
        worker.send(message);
      } else {
        worker.postMessage(message);
      }
    } else {
      this.taskQueue.push(input);
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
      const { id, data, channel, callback } = this.taskQueue.shift() ?? {};

      if (!id || !data || !channel || !callback) {
        return;
      }
      const message: Message<any, any> = { id, data, channel };

      const worker = this.getAvailableWorker();
      if (worker) {
        this.activeTasks.set(id, { callback, worker });

        if (typeof worker.send === "function") {
          worker.send(message);
        } else {
          worker.postMessage(message);
        }
      } else {
        this.taskQueue.unshift({ id, data, channel, callback });
      }
    }
  }

  killAll() {
    if (this.isExiting) {
      return;
    }
    console.log("Killing all child processes");
    this.isExiting = true;
    this.pool.forEach((worker) => worker.kill("SIGTERM"));
  }
}

let pool: ThreadPool<any, any> | null;

export const getGlobalThreadPool = <T, U = unknown>():
  | ThreadPool<T, U>
  | undefined
  | null => pool;

export const hasThreadPool = () => Boolean(getGlobalThreadPool());

export const createThreadPool = (forkFn: ForkFn, workerScript: string) => {
  if (!pool) {
    const start = Date.now();
    console.log("\nCreating thread Pool...");
    pool = new ThreadPool(os.cpus().length, workerScript, forkFn);
    console.log(
      `Took ${((Date.now() - start) / 1000).toFixed(2)} seconds to create thread pool\n`,
    );
  }
};

export const destroyThreadPool = () => {
  if (pool) {
    const start = Date.now();
    console.log("\nDestroying Thread Pool...");
    pool.killAll();
    pool = null;
    console.log(
      `Took ${((Date.now() - start) / 1000).toFixed(2)} seconds to destroy thread pool\n`,
    );
  }
};

const exitSignals = ["SIGINT", "SIGTERM", "SIGHUP", "SIGQUIT"];

exitSignals.forEach((signal) => {
  process.on(signal, (signal: string) => {
    console.log(`Got ${signal}. Terminating...`);
    const pool = getGlobalThreadPool();
    if (pool) {
      pool.killAll();
    }
    process.exit(0);
  });
});
