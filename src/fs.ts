import fs from "fs/promises";
import path, { sep } from "path";

export const imageExts = [".jpg", ".jpeg", ".png", ".webp"];
export const audioExts = [".mp3", ".flac", ".ogg"];
export const extensions = [...imageExts, ...audioExts];

export const isDir = (filepath: string) => {
  return !extensions.some((e) => filepath.toLowerCase().endsWith(e));
};

export const isPathExternal = (pathname: string) =>
  pathname.startsWith("/") || new RegExp(/^[A-Z]:\\\w/).test(pathname);

const satisfiesConstraints = (filename: string) => {
  return (
    !filename.startsWith(".") &&
    extensions.some((e) => filename.toLowerCase().endsWith(e))
  );
};

const recursivelyBuildFileList = async (
  filepath: string,
  srcPath: string,
): Promise<string[]> => {
  const dir = await fs.readdir(filepath, {
    withFileTypes: true,
  });

  let files: string[] = [];
  for (const file of dir) {
    const fullFilepath = path.join(filepath, file.name);

    if (file.isDirectory()) {
      files = files.concat(await recursivelyBuildFileList(fullFilepath, srcPath));
    } else if (satisfiesConstraints(file.name)) {
      files.push(fullFilepath.replace(path.join(srcPath, sep), ""));
    }
  }

  return files;
};

export const traverseFileSystem = async (srcPath: string): Promise<string[]> => {
  return recursivelyBuildFileList(srcPath, srcPath);
};
