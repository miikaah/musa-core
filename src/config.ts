import os from "os";
import path from "path";

export default {
  musadir: path.join(os.homedir(), ".musa"),
  platform: process.platform,
  isDarwin: process.platform === "darwin",
};
