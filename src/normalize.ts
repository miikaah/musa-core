import fs from "node:fs";
import path from "node:path";
import { calculateLoudness } from "./normalization/main";

const [, , basepath] = process.argv;

const dir = fs.readdirSync(basepath);
const files = dir
  .filter(
    (file) => file.endsWith(".mp3") || file.endsWith(".flac") || file.endsWith(".ogg"),
  )
  .map((file) => path.join(basepath, file));

const main = async () => {
  const result = await calculateLoudness(files);
  console.log(result);
};

main();
