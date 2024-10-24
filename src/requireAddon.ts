import { createRequire } from "node:module";
import path from "node:path";

const binpath = "bin";
const name = "normalization";
const version = "v1.0.0";

const requireAddon = createRequire(__dirname);

const binaryByPlatform = {
  aix: "",
  android: "",
  cygwin: "",
  darwin: path.join(binpath, `${name}-${version}-darwin-arm64.node`),
  freebsd: "",
  haiku: "",
  linux: path.join(binpath, `${name}-${version}-linux-x64.node`),
  netbsd: "",
  openbsd: "",
  sunos: "",
  win32: path.join(binpath, `${name}-${version}-win-x64.node`),
};

export const normalization = () => {
  const bin = binaryByPlatform[process.platform];

  if (bin) {
    return requireAddon(path.resolve(__dirname, bin));
  }

  throw new Error(`Not implemented for platform ${process.platform}`);
};
