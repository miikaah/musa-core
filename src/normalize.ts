import childProcess from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { calculateLoudness } from "./normalization/main";
import { createThreadPool, destroyThreadPool } from "./threadPool";

const [, , basepath] = process.argv;

const dir = fs.readdirSync(basepath);
const files = dir
  .filter(
    (file) => file.endsWith(".mp3") || file.endsWith(".flac") || file.endsWith(".ogg"),
  )
  .map((file) => path.join(basepath, file));

createThreadPool(
  childProcess.fork,
  path.join(__dirname, "../lib/normalization/worker.js"),
);

const main = async () => {
  const result = await calculateLoudness(files);
  console.log(result);
  destroyThreadPool();
  process.exit(0);
};

void main();
