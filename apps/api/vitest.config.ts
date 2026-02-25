import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/*.test.ts",
        "src/esbuild.ts",
        "src/handler.ts",
        "src/db/migrations/**",
        "src/db/seed.ts",
      ],
    },
  },
});
