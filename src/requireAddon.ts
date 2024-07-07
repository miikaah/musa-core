import { createRequire } from "node:module";
import path from "node:path";

const requireAddon = createRequire(__dirname);

const binaryByPlatform = {
  aix: "",
  android: "",
  cygwin: "",
  darwin: "bin/normalization-v1.0.0-darwin-arm64.node",
  freebsd: "",
  haiku: "",
  linux: "",
  netbsd: "",
  openbsd: "",
  sunos: "",
  win32: "",
};

export const normalization = () => {
  const bin = binaryByPlatform[process.platform];

  if (bin) {
    return requireAddon(path.resolve(__dirname, bin));
  }

  throw new Error(`Not implemented for platform ${process.platform}`);
};
