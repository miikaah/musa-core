import { build } from "esbuild";
import { nodeExternalsPlugin } from "esbuild-node-externals";
import { Dirent, promises as fs } from "fs";
import path from "path";

type FileTreeNode = {
  filepath: string;
  file: Dirent;
};

const recursivelyBuildFileTree = async (
  srcPath = "",
  currentPath = "",
): Promise<FileTreeNode[]> => {
  const filepath = path.join(srcPath, currentPath);

  const dir = await fs.readdir(filepath, {
    withFileTypes: true,
  });

  let files: FileTreeNode[] = [];
  for (const file of dir) {
    if (file.isDirectory()) {
      files = files.concat(await recursivelyBuildFileTree(filepath, file.name));
    } else {
      files.push({ filepath, file });
    }
  }

  return files;
};

const endsWith = ["spec.ts"];
const excluded = ["jestSetup.ts"];

const outExcluded = (f: FileTreeNode) =>
  !endsWith.map((ew) => f.file.name.endsWith(ew)).some(Boolean) &&
  !excluded.includes(f.file.name);

const exec = async () => {
  const srcPath = "src";
  const filesArr = await recursivelyBuildFileTree(srcPath);
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
