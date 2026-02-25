import { build } from "esbuild";
import { builtinModules } from "node:module";

const MINIFY = process.env.MINIFY !== "false";

const allBuiltinModules = [
  ...builtinModules,
  ...builtinModules.map((m) => `node:${m}`),
];

await build({
  entryPoints: ["src/handler.ts"],
  bundle: true,
  packages: "bundle",
  format: "esm",
  target: "es2022",
  platform: "browser",
  conditions: ["browser", "worker", "import", "default"],
  outfile: "dist/handler.js",
  external: allBuiltinModules,
  keepNames: !MINIFY,
  minify: MINIFY,
  sourcemap: !MINIFY,
  banner: {
    js: [
      'import * as process from "node:process";',
      'import { Buffer } from "node:buffer";',
      "globalThis.process ??= process;",
      "globalThis.Buffer ??= Buffer;",
      "globalThis.global ??= globalThis;",
    ].join("\n"),
  },
  define: {
    "process.env.NODE_ENV": '"production"',
  },
});

console.log("Build complete: dist/handler.js");
