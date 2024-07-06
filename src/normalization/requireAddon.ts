import { createRequire } from "node:module";

const requireAddon = createRequire(__dirname);

export const normalization = requireAddon(
  "../bin/normalization-v1.0.0-darwin-arm64.node",
);
