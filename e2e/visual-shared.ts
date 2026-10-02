import { test, expect, type Locator, type Page } from "@playwright/test";

// What every visual spec shares: the network guard and the one comparison.
// The thresholds live in playwright.config (`expect.toHaveScreenshot`), so
// every adapter is held to the same ones.

// A baseline may only depend on what this repository serves. Anything the
// page fetches from another host is recorded and fails the test, whether the
// URL was written in the source or assembled at runtime.
const LOCAL = new Set(["127.0.0.1", "localhost"]);

/** Records every request that leaves the machine, and aborts it. */
export async function guardNetwork(page: Page): Promise<string[]> {
  const remote: string[] = [];
  await page.route("**/*", (route) => {
    const host = new URL(route.request().url()).hostname;
    if (LOCAL.has(host)) return route.continue();
    remote.push(route.request().url());
    return route.abort();
  });
  return remote;
}

/** Waits for the frame, checks nothing left the machine, compares the shot. */
export async function compareFrame(frame: Locator, remote: string[], snapshot: string) {
  await expect(frame).toBeVisible();
  expect(remote, remote.join("\n")).toEqual([]);
  await expect(frame).toHaveScreenshot(snapshot);
}

/**
 * The Svelte visual set, by name. The adapters' visual pages render the same
 * components, with the same data as the Svelte demos, so the four suites
 * compare like with like.
 */
export const VISUAL_COMPONENTS = [
  "button",
  "empty-state",
  "error-state",
  "tag",
  "card",
  "inline-notification",
  "checkbox",
  "checkbox-group",
  "switch",
  "radio-group",
  "segmented-control",
  "slider",
  "range-slider",
  "rating-group",
  "progress",
  "meter",
  "text-field",
  "select",
  "pagination",
  "avatar",
  "label",
] as const;

export type VisualComponent = (typeof VISUAL_COMPONENTS)[number];

// A few demos are compared in dark as well: their colours come from role
// tokens that change with the theme, so a light shot alone would not see a
// wrong one.
export const DARK_TOO: ReadonlySet<VisualComponent> = new Set(["meter"]);

// The Vue example serves the adapters' visual pages. The origin follows the
// same variable the global setup reads, so a run against another port checks
// and shoots the same server.
const exampleOrigin = process.env.DS_E2E_VUE_ORIGIN ?? "http://127.0.0.1:4390";

/**
 * One test per component (and per theme where DARK_TOO says so) against an
 * adapter's visual page in the Vue example. Each shot is the component's
 * `[data-visual]` frame; the snapshot names match the Svelte suite's, and
 * each spec file keeps its own snapshot folder, so they never collide.
 */
export function describeAdapterVisuals(
  adapter: string,
  pagePath: string,
  components: readonly VisualComponent[],
) {
  for (const name of components) {
    for (const theme of DARK_TOO.has(name) ? (["light", "dark"] as const) : (["light"] as const)) {
      const label = theme === "dark" ? `${name} dark` : name;
      test(`visual (${adapter}): ${label}`, async ({ page }) => {
        const remote = await guardNetwork(page);
        // The page sets the theme from the address before its first render.
        await page.goto(`${exampleOrigin}/${pagePath}?theme=${theme}`, {
          waitUntil: "networkidle",
        });
        await compareFrame(
          page.locator(`[data-visual="${name}"]`),
          remote,
          `${label.replace(/ /g, "-")}.png`,
        );
      });
    }
  }
}
