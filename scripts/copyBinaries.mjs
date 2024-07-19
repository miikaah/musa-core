import fs from "node:fs/promises";
import path from "node:path";

const buildpath = "addons/normalization/build/Release/";
const name = "normalization";
const version = "v1.0.0";
const dest = "src/bin/";
const libdir = "addons/lib";
const libdest = "lib/bin";

const binaryByPlatform = {
  aix: "",
  android: "",
  cygwin: "",
  darwin: `${name}-${version}-darwin-arm64.node`,
  freebsd: "",
  haiku: "",
  linux: "",
  netbsd: "",
  openbsd: "",
  sunos: "",
  win32: `${name}-${version}-win-x64.node`,
};

const main = async () => {
  const bin = binaryByPlatform[process.platform];

  if (bin) {
    // Copy the platform specific node C addon binary to git
    await fs.cp(path.join(buildpath, bin), path.join(dest, bin));
  }

  // Copy the external library binary files for build
  const files = (await fs.readdir(libdir)).filter((file) => file.endsWith(".dll"));

  for (const file of files) {
    await fs.copyFile(path.join(libdir, file), path.join(libdest, file));
  }
};

main();
