import { normalization } from "../requireAddon";

process.on("message", (message: { id: number; filepath: string }) => {
  try {
    const { id, filepath } = message;
    const result = normalization().calc_loudness(filepath);

    if (!process.send) {
      throw new Error("process.send is undefined");
    }

    process.send({ id, result });
  } catch (error) {
    console.error("Failed to call normalization C addon", error);
    throw error;
  }
});
