import { MessageEvent } from "../normalization.types";
import { normalization } from "../requireAddon";

// For Electron child process
(process as any).parentPort?.on("message", (message: MessageEvent) => {
  try {
    if ((process as any).parentPort) {
      const { id, filepath } = message.data;
      let result;

      if (process.platform === "win32") {
        result = normalization().windows_calc_loudness(filepath);
      } else {
        result = normalization().calc_loudness(filepath);
      }

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
    if (process.send) {
      const { id, filepath } = message;
      let result;

      if (process.platform === "win32") {
        result = normalization().windows_calc_loudness(filepath);
      } else {
        result = normalization().calc_loudness(filepath);
      }

      process.send({ id, result });
      return;
    }

    throw new Error("Invalid child process");
  } catch (error) {
    console.error("NodeJS failed to call normalization C addon", error);
    throw error;
  }
});
