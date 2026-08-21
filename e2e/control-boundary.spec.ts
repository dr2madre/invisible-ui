import { expect, test, type Page } from "@playwright/test";

// The control boundary contract, measured on rendered pages rather than on the
// stylesheet: the edge that identifies a control clears 3:1 against what it
// really sits on, in both themes, and the state indicators that come with it
// (switch thumb, checkbox glyph) stay perceivable. WCAG 2.2 SC 1.4.11.

type Rgba = [number, number, number, number];

function parseColor(value: string): Rgba {
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

function luminance([r, g, b]: Rgba): number {
  return [r, g, b]
    .map((channel) => {
      const c = channel / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    })
    .reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i], 0);
}

function contrast(a: Rgba, b: Rgba): number {
  const [hi, lo] = [Math.max(luminance(a), luminance(b)), Math.min(luminance(a), luminance(b))];
  return (hi + 0.05) / (lo + 0.05);
}

/** Composite an alpha colour over an opaque one, so overlays measure honestly. */
function over(front: Rgba, back: Rgba): Rgba {
  const alpha = front[3];
  return [
    front[0] * alpha + back[0] * (1 - alpha),
    front[1] * alpha + back[1] * (1 - alpha),
    front[2] * alpha + back[2] * (1 - alpha),
    1,
  ];
}

const style = (page: Page, selector: string, property: string) =>
  page
    .locator(selector)
    .first()
    .evaluate((node, prop) => getComputedStyle(node).getPropertyValue(prop), property);

const pageBackground = (page: Page) =>
  page.evaluate(() => {
    const body = getComputedStyle(document.body).backgroundColor;
    return body === "rgba(0, 0, 0, 0)" || body === "transparent"
      ? getComputedStyle(document.documentElement).backgroundColor
      : body;
  });

// Set before navigation, so the theme applies at first paint and no
// border-color transition is mid-flight when the test reads a computed value.
async function setTheme(page: Page, theme: "light" | "dark") {
  await page.addInitScript((value) => {
    document.addEventListener("DOMContentLoaded", () =>
      document.documentElement.setAttribute("data-theme", value),
    );
  }, theme);
}

// A dark test that silently measured light values would pass for the wrong
// reason, so every test first proves the theme really took effect.
async function assertTheme(page: Page, theme: "light" | "dark") {
  const back = parseColor(await pageBackground(page));
  if (theme === "dark") expect(luminance(back)).toBeLessThan(0.2);
  else expect(luminance(back)).toBeGreaterThan(0.5);
}

for (const theme of ["light", "dark"] as const) {
  test.describe(`rendered control boundary (${theme})`, () => {
    test("the text field border clears 3:1 against the page", async ({ page }) => {
      await setTheme(page, theme);
      await page.goto("components/forms/text-field/");
      await assertTheme(page, theme);
      const border = parseColor(await style(page, ".field__control", "border-top-color"));
      const back = parseColor(await pageBackground(page));
      expect(contrast(over(border, back), back)).toBeGreaterThanOrEqual(3);
    });

    test("the switch off track clears 3:1 and its thumb stays separable", async ({ page }) => {
      await setTheme(page, theme);
      await page.goto("components/forms/switch/");
      await assertTheme(page, theme);
      const track = parseColor(await style(page, ".switch", "background-color"));
      const back = parseColor(await pageBackground(page));
      expect(contrast(over(track, back), back)).toBeGreaterThanOrEqual(3);

      // The thumb (an ::after pseudo-element), or the page-coloured rim around
      // it, must clear 3:1 against the track.
      const pseudo = (property: string) =>
        page
          .locator(".switch")
          .first()
          .evaluate(
            (node, prop) => getComputedStyle(node, "::after").getPropertyValue(prop),
            property,
          );
      const thumb = parseColor(await pseudo("background-color"));
      const rimShadow = await pseudo("box-shadow");
      const rimColor = rimShadow.match(/rgba?\([^)]+\)|color\(srgb[^)]+\)/)?.[0];
      if (!rimColor) throw new Error(`the thumb has no rim shadow to measure: ${rimShadow}`);
      const rim = parseColor(rimColor);
      const trackOpaque = over(track, back);
      const best = Math.max(
        contrast(over(thumb, trackOpaque), trackOpaque),
        contrast(over(rim, trackOpaque), trackOpaque),
      );
      expect(best).toBeGreaterThanOrEqual(3);
    });

    test("the checkbox border clears 3:1 unchecked and checked", async ({ page }) => {
      await setTheme(page, theme);
      await page.goto("components/forms/checkbox/");
      await assertTheme(page, theme);
      const back = parseColor(await pageBackground(page));
      const unchecked = parseColor(await style(page, ".checkbox", "border-top-color"));
      expect(contrast(over(unchecked, back), back)).toBeGreaterThanOrEqual(3);

      // The real input is visually hidden, so drive it through the DOM.
      const box = page.locator(".checkbox__input").first();
      await box.evaluate((node) => {
        (node as HTMLInputElement).checked = true;
        node.dispatchEvent(new Event("change", { bubbles: true }));
      });
      const checked = parseColor(
        await style(page, ".checkbox__input:checked + .checkbox", "border-top-color"),
      );
      expect(contrast(over(checked, back), back)).toBeGreaterThanOrEqual(3);

      // The glyph carries the checked state: measure it over the tinted fill
      // composited onto the page.
      const glyph = parseColor(await style(page, ".checkbox__input:checked + .checkbox", "color"));
      const fill = parseColor(
        await style(page, ".checkbox__input:checked + .checkbox", "background-color"),
      );
      expect(contrast(over(glyph, back), over(fill, back))).toBeGreaterThanOrEqual(3);
      await box.evaluate((node) => {
        (node as HTMLInputElement).checked = false;
        node.dispatchEvent(new Event("change", { bubbles: true }));
      });
    });

    test("the focus ring clears 3:1 and differs from the resting border", async ({ page }) => {
      await setTheme(page, theme);
      await page.goto("components/forms/text-field/");
      await assertTheme(page, theme);
      const back = parseColor(await pageBackground(page));
      const resting = parseColor(await style(page, ".field__control", "border-top-color"));
      // Resolve the ring through a probe element so color-mix() computes.
      const ring = parseColor(
        await page.evaluate(() => {
          const probe = document.createElement("div");
          probe.style.color = "var(--ds-color-focus-ring)";
          document.body.append(probe);
          const value = getComputedStyle(probe).color;
          probe.remove();
          return value;
        }),
      );
      expect(contrast(over(ring, back), back)).toBeGreaterThanOrEqual(3);
      // Not the same colour as the resting border, so focus reads as focus.
      expect(ring.slice(0, 3).join()).not.toBe(resting.slice(0, 3).join());
    });
  });
}
