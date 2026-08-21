import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

// The token catalog has one job: show what the stylesheet really does. So the
// checks here compare what the browser paints against the generated registry,
// and a specimen that stopped reading its own token fails them.

interface Token {
  name: string;
  replacedBy: string | null;
  id: string;
  valueType: string;
  purpose: string | null;
  group: string | null;
  resolved: { light: string | null; dark: string | null };
  expressions: { darkAttr: string | null; darkMedia: string | null };
}

const registry = JSON.parse(
  readFileSync("packages/docs/src/generated/tokens/registry.json", "utf8"),
) as { tokens: Token[]; counts: { total: number } };

const PAGE = "presentation/token-catalog/";

type Rgba = [number, number, number, number];

/** "#7a52cc" or "#7a52cc at 30% alpha" as numbers. */
function fromRegistry(resolved: string): Rgba {
  const hex = resolved.slice(1, 7);
  const [r, g, b] = [0, 2, 4].map((index) => Number.parseInt(hex.slice(index, index + 2), 16));
  const alpha = /at (\d+)% alpha/.exec(resolved);
  return [r, g, b, alpha ? Number(alpha[1]) / 100 : 1];
}

/**
 * What the browser reports. Engines answer a color-mix() in different shapes:
 * `rgb()`, `rgba()` or `color(srgb …)` with 0–1 channels.
 */
function fromComputed(value: string): Rgba {
  const srgb = /^color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)/.exec(value);
  if (srgb) {
    return [
      Number(srgb[1]) * 255,
      Number(srgb[2]) * 255,
      Number(srgb[3]) * 255,
      srgb[4] === undefined ? 1 : Number(srgb[4]),
    ];
  }
  const rgb = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+))?/.exec(value);
  if (!rgb) throw new Error(`cannot read colour: ${value}`);
  return [
    Number(rgb[1]),
    Number(rgb[2]),
    Number(rgb[3]),
    rgb[4] === undefined ? 1 : Number(rgb[4]),
  ];
}

test("every token in the registry has a card on the page", async ({ page }) => {
  await page.goto(PAGE);
  await expect(page.locator("[data-tk-token]")).toHaveCount(registry.counts.total);
  for (const token of registry.tokens) {
    await expect(page.locator(`[data-tk-token][data-name="${token.name}"]`)).toHaveCount(1);
  }
});

test("a colour specimen paints the value the registry resolved, in both themes", async ({
  page,
}) => {
  await page.goto(PAGE);
  const colours = registry.tokens.filter((token) => token.valueType === "color");
  // A spread of shapes: a plain palette step, a role that swaps per theme, a
  // role built with color-mix, and a see-through overlay.
  const sample = [
    "--ds-purple-500",
    "--ds-color-surface",
    "--ds-color-info-surface",
    "--ds-state-hover",
  ]
    .map((name) => colours.find((token) => token.name === name))
    .filter((token): token is Token => Boolean(token));
  expect(sample).toHaveLength(4);

  for (const token of sample) {
    for (const theme of ["light", "dark"] as const) {
      const specimen = page.locator(
        `[data-tk-token][data-name="${token.name}"] [data-theme="${theme}"] .tk-specimen`,
      );
      const painted = await specimen.evaluate((node) => getComputedStyle(node).backgroundColor);
      const actual = fromComputed(painted);
      const wanted = fromRegistry(token.resolved[theme]!);
      // One step of tolerance per channel: the engines round a mix differently.
      for (const channel of [0, 1, 2]) {
        expect(
          Math.abs(actual[channel] - wanted[channel]),
          `${token.name} in ${theme} (${painted})`,
        ).toBeLessThanOrEqual(1);
      }
      expect(
        Math.abs(actual[3] - wanted[3]),
        `${token.name} alpha in ${theme}`,
      ).toBeLessThanOrEqual(0.01);
    }
  }
});

test("a token with a dark override paints differently in the two panes", async ({ page }) => {
  await page.goto(PAGE);
  const swapping = registry.tokens.find(
    (token) =>
      token.valueType === "color" &&
      (token.expressions.darkAttr ?? token.expressions.darkMedia) &&
      token.resolved.light !== token.resolved.dark,
  );
  expect(swapping).toBeDefined();
  const card = page.locator(`[data-tk-token][data-name="${swapping!.name}"]`);
  const read = (theme: string) =>
    card
      .locator(`[data-theme="${theme}"] .tk-specimen`)
      .evaluate((node) => getComputedStyle(node).backgroundColor);
  expect(await read("light")).not.toBe(await read("dark"));
});

test("the light column stays light while the page itself is dark", async ({ page }) => {
  await page.goto(PAGE);
  const token = registry.tokens.find((entry) => entry.name === "--ds-color-surface")!;
  const card = page.locator(`[data-tk-token][data-name="${token.name}"]`);
  const read = (theme: string) =>
    card
      .locator(`[data-theme="${theme}"] .tk-specimen`)
      .evaluate((node) => getComputedStyle(node).backgroundColor);

  await page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark"));
  const light = fromComputed(await read("light"));
  const wanted = fromRegistry(token.resolved.light!);
  for (const channel of [0, 1, 2]) {
    expect(
      Math.abs(light[channel] - wanted[channel]),
      `${token.name} light pane on a dark page`,
    ).toBeLessThanOrEqual(1);
  }
});

test("the filter narrows the list and reports the count", async ({ page }) => {
  await page.goto(PAGE);
  const search = page.getByLabel("Filter by name or role");
  await expect(search).toBeVisible();

  // A query that matches part of several groups, so hiding whole groups is not
  // enough to pass: the count reported must equal the cards left on screen.
  for (const query of ["radius", "primary", "hover", "surface"]) {
    await search.fill(query);
    const expected = registry.tokens.filter((token) =>
      `${token.name} ${token.purpose ?? token.group ?? ""}`.toLowerCase().includes(query),
    ).length;
    expect(expected).toBeGreaterThan(0);
    await expect(page.locator("[data-tk-token]:visible")).toHaveCount(expected);
    await expect(page.locator("[data-tk-status]")).toContainText(`${expected} of`);
  }

  await search.fill("");
  await expect(page.locator("[data-tk-token]:visible")).toHaveCount(registry.counts.total);
});

test("the search field is not offered when scripting is off", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(PAGE);
  await expect(page.getByLabel("Filter by name or role")).toBeHidden();
  // The catalog itself must still be there to read.
  await expect(page.locator("[data-tk-token]")).toHaveCount(registry.counts.total);
  await context.close();
});

test("a deprecated token names its replacement on its card", async ({ page }) => {
  await page.goto(PAGE);
  const deprecated = registry.tokens.filter((token) => token.replacedBy);
  expect(deprecated.length).toBeGreaterThan(0);
  for (const token of deprecated) {
    const card = page.locator(`[data-tk-token][data-name="${token.name}"]`);
    await expect(card).toContainText("deprecated");
    await expect(card).toContainText(token.replacedBy!);
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
