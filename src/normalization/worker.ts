import { MessageEvent } from "../normalization.types";
import { normalization } from "../requireAddon";

// For Electron child process
(process as any).parentPort?.on("message", (message: MessageEvent) => {
  try {
    if ((process as any).parentPort) {
      const { id, filepath } = message.data;
      const result = normalization().calc_loudness(filepath);
      (process as any).parentPort.postMessage({ id, result });
      return;
    }

    throw new Error("Invalid child process");
  } catch (error) {
    console.error("Electron failed to call normalization C addon", error);
    throw error;
  }
});

// For NodeJS child process
process.on("message", (message: { id: string; filepath: string }) => {
  try {
    console.log("Message from parent:", message);
    if (process.send) {
      const { id, filepath } = message;
      const result = normalization().calc_loudness(filepath);

      process.send({ id, result });
      return;
    }

    throw new Error("Invalid child process");
  } catch (error) {
    console.error("NodeJS failed to call normalization C addon", error);
    throw error;
  }
});
