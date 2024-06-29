import { parentPort } from "worker_threads";
import { normalization } from "./requireAddon.mjs";

parentPort.on("message", ({ channel, input }) => {
  const result = normalization[channel](input);
  parentPort.postMessage(result);
});
