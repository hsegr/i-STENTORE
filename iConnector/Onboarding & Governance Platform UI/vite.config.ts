import { defineConfig } from "vite-plus";

export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  lint: {
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    rules: { "vite-plus/prefer-vite-plus-imports": "error" },
    options: { typeAware: true, typeCheck: true },
  },
  fmt: {
    sortTailwindcss: {
      stylesheet: "./apps/client-web/src/index.css",
    },
    bracketSpacing: true,
    tabWidth: 2,
    useTabs: false,
    printWidth: 120,
    sortPackageJson: false,
    ignorePatterns: [
      "dist",
      "**/dist",
      "node_modules",
      "**/node_modules",
      "pnpm-lock.yaml",
      "**/logs/",
      "**/*.log",
      "**/npm-debug.log*",
      "**/yarn-debug.log*",
      "**/yarn-error.log*",
      "**/pnpm-debug.log*",
      "apps/client-web/test-results",
    ],
  },
});
