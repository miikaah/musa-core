import { parentPort } from "node:worker_threads";
import { normalization } from "../requireAddon";

if (!parentPort) {
  throw new Error("Failed to create parentPort");
}

parentPort.on("message", ({ channel, input }) => {
  try {
    const result = normalization()[channel](input);
    parentPort!.postMessage(result);
  } catch (error) {
    console.error("Failed to call normalization C addon", error);
  }
});
