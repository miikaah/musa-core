import { parentPort } from "worker_threads";
import { createRequire } from "node:module";

const requireAddon = createRequire(import.meta.url);
const addonpath =
  process.env.NODE_ENV === "production"
    ? "../../bin/normalization-v1.0.0-darwin-arm64.node"
    : "./build/Release/normalization-v1.0.0-darwin-arm64.node";

function calcLoudness(file) {
  try {
    const normalization = requireAddon(addonpath);

    return normalization.calc_loudness(["", file]);
  } catch (error) {
    if (error.message.includes("Cannot find module '../../bin/normalization")) {
      console.warn("Failed to require normalization addon. Ignoring.");
    } else {
      console.error(error);
      process.exit(1);
    }
  }
}

parentPort.on("message", (message) => {
  const result = calcLoudness(message);
  parentPort.postMessage(result);
});
