import { parentPort } from "worker_threads";
import { normalization } from "./requireAddon.mjs";

parentPort.on("message", ({ channel, input }) => {
  try {
    const result = normalization[channel](input);
    parentPort.postMessage(result);
  } catch (error) {
    console.error("Failed to call normalization C addon", error);
  }
});
