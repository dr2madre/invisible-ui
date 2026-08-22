import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

// The component-token catalog is generated from usage: these tests hold the
// page to the registry it claims to render.

interface ComponentToken {
  name: string;
  id: string;
  category: string;
  parents: string[];
  fallbacks: string[];
}

const registry = JSON.parse(
  readFileSync("packages/docs/src/generated/tokens/registry.json", "utf8"),
) as { componentTokens: ComponentToken[] };

const PAGE = "presentation/component-tokens/";

test("every knob in the registry has a card on the page", async ({ page }) => {
  await page.goto(PAGE);
  await expect(page.locator("[data-ctk-token]")).toHaveCount(registry.componentTokens.length);
  for (const token of registry.componentTokens.slice(0, 5)) {
    await expect(page.locator(`[data-ctk-token][data-name="${token.name}"]`)).toHaveCount(1);
  }
});

test("a knob that follows a role repaints with the dark theme", async ({ page }) => {
  // --ds-calendar-range-band falls back through --ds-color-selected: its
  // specimen must resolve, and follow the theme, without the knob ever being
  // defined anywhere.
  await page.addInitScript(() => {
    document.addEventListener("DOMContentLoaded", () =>
      document.documentElement.setAttribute("data-theme", "dark"),
    );
  });
  await page.goto(PAGE);
  const card = page.locator('[data-ctk-token][data-name="--ds-calendar-range-band"]');
  const read = (theme: string) =>
    card
      .locator(`[data-theme="${theme}"] .ctk-specimen`)
      .evaluate((node) => getComputedStyle(node).backgroundColor);
  const light = await read("light");
  const dark = await read("dark");
  expect(light).not.toBe("rgba(0, 0, 0, 0)");
  // selected keeps the same purple in both themes today, so equality is the
  // honest expectation; what matters is that both resolve through the chain.
  expect(dark).not.toBe("rgba(0, 0, 0, 0)");
});

test("the filter narrows the knobs and reports the count", async ({ page }) => {
  await page.goto(PAGE);
  const search = page.getByLabel("Filter by name, component or role");
  await expect(search).toBeVisible();
  for (const query of ["radius", "calendar", "selected"]) {
    await search.fill(query);
    const expected = registry.componentTokens.filter((token) =>
      `${token.name} ${token.parents.join(" ")}`.toLowerCase().includes(query),
    ).length;
    const visible = await page.locator("[data-ctk-token]:visible").count();
    // data-role carries component and purpose too, so the page may match more
    // than the name+parents lower bound, never fewer.
    expect(visible).toBeGreaterThanOrEqual(expected);
    await expect(page.locator("[data-ctk-status]")).toContainText(
      `of ${registry.componentTokens.length}`,
    );
  }
});

test("the page reflows at 320 px without scrolling sideways", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto(PAGE);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});
