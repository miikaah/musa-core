import { createRequire } from "node:module";
const requireAddon = createRequire(import.meta.url);

const [, , filepath] = process.argv;

try {
  const normalization = requireAddon("../../bin/normalization-v1.0.0-darwin-arm64.node");

  console.log(normalization.calc_loudness(["", filepath]));
} catch (error) {
  if (error.message.includes("Cannot find module './build/Release/normalization'")) {
    console.warn("Failed to require normalization addon. Ignoring.");
  } else {
    console.error(error);
    process.exit(1);
  }
}
