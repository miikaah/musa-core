import { normalization } from "../requireAddon";
import { Message } from "../threadPool";
import { NormalizationMessage } from "./main";

type MetadataMessage = Message<{ foo: "bar" }, "musa:metadata">;
type WorkerMessage = NormalizationMessage | MetadataMessage;

const handleMessage = (message: WorkerMessage) => {
  switch (message.channel) {
    case "musa:normalization": {
      const { id, data } = message;
      const result = normalization().calc_loudness(data.filepath);

      (process as any).parentPort.postMessage({ id, result });
      return;
    }
    case "musa:metadata": {
      throw new Error("Not implemented");
    }
    default:
      message satisfies never;
      throw new Error(`Unsupported message ${message}`);
  }
};

// For Electron child process
(process as any).parentPort?.on("message", (message: { data: WorkerMessage }) => {
  try {
    if (!(process as any).parentPort) {
      throw new Error("Invalid child process");
    }
    handleMessage(message.data);
  } catch (error) {
    console.error("Electron failed to call normalization C addon", error);
    throw error;
  }
});

// For NodeJS child process
process.on("message", (message: WorkerMessage) => {
  try {
    if (!process.send) {
      throw new Error("Invalid child process");
    }
    handleMessage(message);
  } catch (error) {
    console.error("NodeJS failed to call normalization C addon", error);
    throw error;
  }
});
