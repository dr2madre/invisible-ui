import { test, expect } from "@playwright/test";

// Visual-regression baselines for the styled components. Each test screenshots
// the live demo frame (`.ds-preview`) on its docs page and compares it pixel-by
// -pixel against a committed baseline, catching unintended visual changes
// (a shifted thumb, a dropped border, a wrong colour) that the functional and
// axe tests can't see.
//
// Determinism: animations are disabled (playwright.config) and the set below is
// curated to static demos — no overlays (need interaction), no date-dependent
// surfaces (Calendar's "today"), no looping animation (Skeleton). Baselines are
// authoritative when generated in the pinned Playwright container (see
// docs/visual-testing.md); run `pnpm visual:update` to refresh them.
const components = [
  ["forms", "button"],
  ["feedback", "empty-state"],
  ["feedback", "error-state"],
  ["feedback", "tag"],
  ["data-layout", "card"],
  ["feedback", "inline-notification"],
  ["forms", "checkbox"],
  ["forms", "checkbox-group"],
  ["forms", "switch"],
  ["forms", "radio-group"],
  ["forms", "segmented-control"],
  ["forms", "slider"],
  ["forms", "rating-group"],
  ["data-layout", "progress"],
  ["data-layout", "meter"],
  ["forms", "text-field"],
  ["forms", "select"],
  ["navigation", "pagination"],
  ["data-layout", "avatar"],
  ["forms", "label"],
] as const;

// A baseline may only depend on what this repository serves. Anything the
// page fetches from another host is recorded and fails the test, whether the
// URL was written in the source or assembled at runtime.
const LOCAL = new Set(["127.0.0.1", "localhost"]);

// A few demos are compared in dark as well: their colours come from role
// tokens that change with the theme, so a light shot alone would not see a
// wrong one.
const darkToo = new Set(["meter"]);

for (const [group, name] of components) {
  for (const theme of darkToo.has(name) ? (["light", "dark"] as const) : (["light"] as const)) {
    const label = theme === "dark" ? `${name} dark` : name;
    test(`visual: ${label}`, async ({ page }) => {
      const remote: string[] = [];
      await page.route("**/*", (route) => {
        const host = new URL(route.request().url()).hostname;
        if (LOCAL.has(host)) return route.continue();
        remote.push(route.request().url());
        return route.abort();
      });
      // Before the first paint: a theme set later animates its way in, and
      // the shot would catch the transition.
      await page.addInitScript((value) => {
        document.addEventListener("DOMContentLoaded", () =>
          document.documentElement.setAttribute("data-theme", value),
        );
      }, theme);
      await page.goto(`components/${group}/${name}/`, { waitUntil: "networkidle" });
      const preview = page.locator(".ds-preview").first();
      await expect(preview).toBeVisible();
      expect(remote, remote.join("\n")).toEqual([]);
      await expect(preview).toHaveScreenshot(`${label.replace(/ /g, "-")}.png`);
    });
  }
}
