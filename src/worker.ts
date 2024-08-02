import fs from "node:fs";
import { type MetadataMessage, writeTags } from "./metadata";
import { type NormalizationMessage } from "./normalization/main";
import { normalization } from "./requireAddon";

type WorkerMessage = NormalizationMessage | MetadataMessage;

const sendResult = (output: { id: number; error: Error | null; result: any }) => {
  if ((process as any).parentPort) {
    (process as any).parentPort.postMessage(output);
  } else if (process.send) {
    process.send(output);
  }
};

const handleMessage = async (message: WorkerMessage) => {
  switch (message.channel) {
    case "musa:normalization": {
      const { id, data } = message;

      try {
        const result = normalization().calc_loudness(data.filepath);
        sendResult({ id, error: null, result });
      } catch (error) {
        sendResult({ id, error: error as Error, result: null });
      }

      break;
    }
    case "musa:metadata": {
      const { id, data } = message;
      const { musicLibraryPath, fid, tags } = data;
      const isWorker = true;

      try {
        const result = await writeTags(musicLibraryPath, fid, tags, isWorker);
        sendResult({ id, error: null, result });
      } catch (error) {
        sendResult({ id, error: error as Error, result: null });
      }

      break;
    }
    default:
      message satisfies never;
      throw new Error(`Unsupported message ${message}`);
  }
};

// For Electron child process
(process as any).parentPort?.on("message", (message: { data: WorkerMessage }) =>
  handleMessage(message.data),
);
// For NodeJS child process
process.on("message", (message: WorkerMessage) => {
  void handleMessage(message);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception in worker:", err);
  // Optionally send a message back to the parent process or log it
  (process as any).parentPort.postMessage({ error: err.message });
  fs.writeFileSync("C:\\Users\\Miika\\.musa\\foo.log", err.message);
  process.exit(1); // Exit the process after handling the error
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection in worker:", reason);
  (process as any).parentPort.postMessage({ error: (reason as any)?.message || reason });
  fs.writeFileSync("C:\\Users\\Miika\\.musa\\foo2.log", (reason as any)?.message);
  process.exit(1);
});
