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
  ["feedback", "progress"],
  ["feedback", "meter"],
  ["forms", "text-field"],
  ["forms", "select"],
  ["navigation", "pagination"],
  ["data-layout", "avatar"],
  ["forms", "label"],
] as const;

for (const [group, name] of components) {
  test(`visual: ${name}`, async ({ page }) => {
    await page.goto(`components/${group}/${name}/`, { waitUntil: "networkidle" });
    const preview = page.locator(".ds-preview").first();
    await expect(preview).toBeVisible();
    await expect(preview).toHaveScreenshot(`${name}.png`);
  });
}
