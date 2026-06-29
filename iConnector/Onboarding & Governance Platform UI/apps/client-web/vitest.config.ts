import { configDefaults, defineConfig, mergeConfig } from "vite-plus";
import viteConfig from "./vite.config";

export default defineConfig((configEnv) =>
  mergeConfig(
    viteConfig(configEnv),
    defineConfig({
      test: {
        environment: "node",
        include: ["src/**/*.{test,spec}.{ts,tsx}"],
        exclude: [...configDefaults.exclude, "tests/e2e/**"],
        reporters: [...configDefaults.reporters, ["html", { singleFile: true }], "json"],
        outputFile: {
          html: "./test-results/vitest/index.html",
          json: "./test-results/vitest/results.json",
        },
        restoreMocks: true,
      },
    }),
  ),
);
