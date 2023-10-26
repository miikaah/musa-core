import fs from "fs/promises";
import path, { sep } from "path";

const recursivelyBuildFileList = async (filepath, srcPath) => {
  let dir = [];

  try {
    dir = await fs.readdir(filepath, {
      withFileTypes: true,
    });
  } catch {
    // Output folder might not exist
  }

  let files = [];
  for (const file of dir) {
    const fullFilepath = path.join(filepath, file.name);

    if (file.isDirectory()) {
      files = files.concat(await recursivelyBuildFileList(fullFilepath, srcPath));
    } else if (file.name.endsWith(".types.js")) {
      files.push(fullFilepath.replace(path.join(srcPath, sep), ""));
    }
  }

  return files;
};

const main = async (srcPath) => {
  const files = await recursivelyBuildFileList(srcPath, srcPath);

  files.map((filename) => path.join("lib", filename)).forEach(fs.unlink);
};

main("lib");
