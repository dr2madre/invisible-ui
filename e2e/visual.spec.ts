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
  "button",
  "tag",
  "card",
  "alert",
  "checkbox",
  "checkbox-group",
  "switch",
  "radio-group",
  "segmented-control",
  "slider",
  "rating-group",
  "progress",
  "meter",
  "text-field",
  "select",
  "pagination",
  "avatar",
  "label",
];

for (const name of components) {
  test(`visual: ${name}`, async ({ page }) => {
    await page.goto(`components/${name}/`, { waitUntil: "networkidle" });
    const preview = page.locator(".ds-preview").first();
    await expect(preview).toBeVisible();
    await expect(preview).toHaveScreenshot(`${name}.png`);
  });
}
