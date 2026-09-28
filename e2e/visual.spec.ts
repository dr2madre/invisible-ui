import { test } from "@playwright/test";
import { compareFrame, DARK_TOO, guardNetwork } from "./visual-shared";

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
//
// The same set runs against the other adapters in visual-elements.spec.ts,
// visual-vue.spec.ts and visual-react.spec.ts.
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
  ["forms", "range-slider"],
  ["forms", "rating-group"],
  ["data-layout", "progress"],
  ["data-layout", "meter"],
  ["forms", "text-field"],
  ["forms", "select"],
  ["navigation", "pagination"],
  ["data-layout", "avatar"],
  ["forms", "label"],
] as const;

for (const [group, name] of components) {
  for (const theme of DARK_TOO.has(name) ? (["light", "dark"] as const) : (["light"] as const)) {
    const label = theme === "dark" ? `${name} dark` : name;
    test(`visual: ${label}`, async ({ page }) => {
      const remote = await guardNetwork(page);
      // Before the first paint: a theme set later animates its way in, and
      // the shot would catch the transition.
      await page.addInitScript((value) => {
        document.addEventListener("DOMContentLoaded", () =>
          document.documentElement.setAttribute("data-theme", value),
        );
      }, theme);
      await page.goto(`components/${group}/${name}/`, { waitUntil: "networkidle" });
      await compareFrame(
        page.locator(".ds-preview").first(),
        remote,
        `${label.replace(/ /g, "-")}.png`,
      );
    });
  }
}
