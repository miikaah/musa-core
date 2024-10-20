import fs from "fs/promises";
import config from "./config";

export const checkMusadirExists = async () => {
  try {
    await fs.access(config.musadir, fs.constants.F_OK);
  } catch (e: any) {
    if (e.code === "ENOENT") {
      try {
        console.log("Musadir does not exist. Attempting to create it.");
        await fs.mkdir(config.musadir);
        console.log("Created Musadir.");
      } catch (e) {
        console.error("Failed to create musadir", e);
      }
    } else {
      console.log("The musadir fs.access call threw", e);
    }
  }
};
