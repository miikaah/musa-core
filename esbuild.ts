import { promises as fs } from "fs";
import * as path from "path";
import { Dirent } from "fs";
import { build } from "esbuild";
import { nodeExternalsPlugin } from "esbuild-node-externals";

type FileTreeNode = {
  filepath: string;
  file: Dirent;
};

const srcPath = "src";

const recursivelyBuildFileTree = async (filepath = srcPath): Promise<FileTreeNode[]> => {
  const fpath = filepath !== srcPath ? path.join(srcPath, filepath) : filepath;
  const dir = await fs.readdir(fpath, {
    withFileTypes: true,
  });

  let files = [];
  for (const file of dir) {
    if (file.isDirectory()) {
      files = files.concat(await recursivelyBuildFileTree(file.name));
    } else {
      files.push({ filepath: fpath, file });
    }
  }

  return files;
};

const endsWith = ["spec.ts"];
const excluded = ["jestSetup.ts"];

const outExcluded = (f: FileTreeNode) =>
  !endsWith.map((ew) => f.file.name.endsWith(ew)).some(Boolean) && !excluded.includes(f.file.name);

const exec = async () => {
  const filesArr = await recursivelyBuildFileTree();
  const cleanFiles = filesArr.filter(outExcluded);
  const entryPoints = cleanFiles.map((f) => path.join(f.filepath, f.file.name));

  build({
    entryPoints,
    outdir: "lib",
    platform: "node",
    target: "es2020",
    format: "cjs",
    plugins: [nodeExternalsPlugin()],
  });
};

exec();
