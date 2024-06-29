import { createRequire } from "node:module";

const requireAddon = createRequire(import.meta.url);
const addonpath =
  process.env.NODE_ENV === "production"
    ? "../../bin/normalization-v1.0.0-darwin-arm64.node"
    : "./build/Release/normalization-v1.0.0-darwin-arm64.node";

export const normalization = requireAddon(addonpath);
