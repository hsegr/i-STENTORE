import { defineConfig, devices } from "@playwright/test";

const clientWebPort = Number.parseInt(process.env.CLIENT_WEB_PORT ?? "8080", 10);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${clientWebPort}`;

export default defineConfig({
  // Look for test files in the "tests" directory, relative to this configuration file.
  testDir: "./tests/e2e",
  outputDir: "./test-results/playwright/artifacts",
  // Run all tests in parallel.
  fullyParallel: true,
  // Fail the build on CI if you accidentally left test.only in the source code.
  forbidOnly: !!process.env.CI,
  // Retry on CI only.
  retries: process.env.CI ? 2 : 0,
  // Opt out of parallel tests on CI.
  workers: process.env.CI ? 1 : undefined,
  // Reporter to use. See https://playwright.dev/docs/test-reporters
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "./test-results/playwright/html" }],
    ["json", { outputFile: "./test-results/playwright/results.json" }],
  ],
  use: {
    // Base URL to use in actions like `await page.goto('/')`.
    baseURL,
    // Collect trace when retrying the failed test.
    trace: "on-first-retry",
  },
  // Configure projects for major browsers.
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
  // Run your local dev server before starting the tests.
  webServer: {
    command: "pnpm exec vite --host 127.0.0.1",
    url: baseURL,
    env: {
      VITE_E2E_AUTH: "true",
      VITE_SKIP_ROUTE_GENERATION: "true",
    },
    reuseExistingServer: !process.env.CI,
  },
});
