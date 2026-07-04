import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

// Real-browser E2E against the built docs site (every component has a live demo
// there). In the Linux devcontainer a pre-installed Chromium lives at a fixed
// path; anywhere else (CI, macOS, …) Playwright's own browser install is used —
// so the hardcoded path only applies when it actually exists.
const localChromium = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const executablePath = !process.env.CI && existsSync(localChromium) ? localChromium : undefined;

const PORT = 4321;
const BASE = `http://localhost:${PORT}/invisible-ui/`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: BASE,
    trace: "on-first-retry",
  },
  // Visual snapshots: disable animations and tolerate sub-pixel anti-aliasing so
  // baselines stay stable across runs. Authoritative baselines are generated in
  // the pinned Playwright container (see docs/visual-testing.md).
  expect: {
    toHaveScreenshot: {
      animations: "disabled",
      maxDiffPixelRatio: 0.02,
    },
  },
  projects: [
    {
      name: "chromium",
      // Functional e2e (smoke + interactions); visual specs run separately.
      testIgnore: /visual\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: executablePath ? { executablePath } : {},
      },
    },
    {
      name: "visual",
      testMatch: /visual\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: executablePath ? { executablePath } : {},
      },
    },
  ],
  webServer: {
    command: `pnpm --filter @design-system/docs preview --host 127.0.0.1 --port ${PORT}`,
    url: BASE,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
