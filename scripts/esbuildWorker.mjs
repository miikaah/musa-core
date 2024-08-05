import { build } from "esbuild";

void build({
  entryPoints: ["./src/worker.ts"],
  bundle: true,
  outdir: "lib",
  platform: "node",
  target: "es2022",
  format: "cjs",
});
