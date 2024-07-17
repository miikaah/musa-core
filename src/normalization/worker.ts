import { MessageEvent } from "../normalization.types";
import { normalization } from "../requireAddon";

const handler = (message: MessageEvent) => {
  try {
    // For Electron child process
    if ((process as any).parentPort) {
      const { id, filepath } = message.data;
      console.log("Got message", message);
      const result = normalization().calc_loudness(filepath);
      console.log("Got result", result);
      (process as any).parentPort.postMessage({ id, result });
      return;
    }

    throw new Error("Invalid child process");
  } catch (error) {
    console.error("Failed to call normalization C addon", error);
    throw error;
  }
};

(process as any).parentPort?.on("message", handler);
