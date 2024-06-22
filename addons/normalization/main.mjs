import { Worker } from "node:worker_threads";
import os from "node:os";
import path from "node:path";

const [, , filepaths] = process.argv;

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
    console.log(`Created a thread pool of size: ${size}`);
  }

  runNext() {
    if (this.queue.length > 0 && this.availableWorkers.length > 0) {
      const { task, resolve, reject } = this.queue.shift();
      const worker = this.availableWorkers.shift();
      worker.task = { resolve, reject };
      worker.postMessage(task);
    }
  }

  runTask(task) {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
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
const files = filepaths.trim().split(",");
const taskPromises = files.map((task) => threadPool.runTask(task));

Promise.all(taskPromises)
  .then((results) => {
    console.log("All results:", results);
    threadPool.destroy();
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    threadPool.destroy();
    process.exit(1);
  });
