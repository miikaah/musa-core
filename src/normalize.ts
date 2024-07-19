import childProcess from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { calculateLoudness, initNormalization } from "./normalization/main";

const [, , basepath] = process.argv;

const dir = fs.readdirSync(basepath);
const files = dir
  .filter(
    (file) => file.endsWith(".mp3") || file.endsWith(".flac") || file.endsWith(".ogg"),
  )
  .map((file) => path.join(basepath, file));

initNormalization(
  childProcess.fork,
  path.join(__dirname, "../lib/normalization/worker.js"),
);

const main = async () => {
  const result = await calculateLoudness(files);
  console.log(result);
  process.exit(0);
};

main();
