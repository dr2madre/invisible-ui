import { expect, test } from "@playwright/test";
import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

// Windows High Contrast (forced colors) replaces the author's colours with the
// user's palette and drops most backgrounds. A control whose only boundary is
// a background colour therefore disappears. This checks that every control on
// the risk-tier pages keeps a boundary the user can see: a border, an outline
// or its own text. Whether each state stays distinguishable is not checked
// here, and several are still carried by a tint alone.
//
// Emulation is Chromium-only, so this supports (never replaces) the manual
// Windows pass.

const PAGES = [
  "components/forms/combobox/",
  "components/forms/number-field/",
  "components/forms/select/",
  "components/patterns/table-set/",
  "components/feedback/dialog/",
  "components/navigation/tabs/",
];

test.describe("forced colors", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "emulation is Chromium-only");

  test("every control keeps a visible boundary", async ({ browser }) => {
    const context = await browser.newContext({ forcedColors: "active" });
    const page = await context.newPage();
    const invisible: string[] = [];

    let checked = 0;
    for (const url of PAGES) {
      const response = await page.goto(url);
      // A page that does not exist reports no problems at all: this list used
      // to name one, and the roles only it carries were never measured.
      expect(response?.ok(), `${url} did not load`).toBeTruthy();
      await page.waitForLoadState("load");
      // The demos mount when they scroll into view, and some render nothing
      // at all before that.
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight) {
          window.scrollTo(0, y);
          await new Promise((resolve) => requestAnimationFrame(resolve));
        }
        window.scrollTo(0, 0);
      });
      await expect
        .poll(() => page.evaluate(() => document.querySelectorAll("astro-island:empty").length))
        .toBe(0);
      const found = await page.evaluate(() => {
        const out: string[] = [];
        let seen = 0;
        const selector = "button, input, select, textarea, [role=option], [role=tab]";
        for (const element of document.querySelectorAll(selector)) {
          const className = (element.className || "").toString();
          if (/\bsl-|pagefind|astro/.test(className)) continue;
          // The documentation theme's own chrome (code-block copy buttons)
          // is not the library under test.
          if (element.closest(".copy, .expressive-code, header, nav")) continue;
          const rect = element.getBoundingClientRect();
          if (rect.width < 2 || rect.height < 2) continue;
          seen += 1;
          const style = getComputedStyle(element);
          const hasBorder =
            parseFloat(style.borderTopWidth) > 0 ||
            parseFloat(style.borderBottomWidth) > 0 ||
            parseFloat(style.borderLeftWidth) > 0 ||
            parseFloat(style.borderRightWidth) > 0;
          const hasOutline = style.outlineStyle !== "none" && parseFloat(style.outlineWidth) > 0;
          // Text carries its own shape, so a bare text button still reads, and
          // so does a glyph: forced colors keeps strokes and fills visible.
          const hasText = (element.textContent ?? "").trim().length > 0;
          const hasGlyph = element.querySelector("svg") !== null;
          // A field's boundary usually belongs to the box drawn around it.
          let hasFrame = false;
          for (let a = element.parentElement, up = 0; a && up < 2; a = a.parentElement, up += 1) {
            const parent = getComputedStyle(a);
            if (
              parseFloat(parent.borderTopWidth) > 0 ||
              parseFloat(parent.borderBottomWidth) > 0 ||
              parseFloat(parent.borderLeftWidth) > 0 ||
              parseFloat(parent.borderRightWidth) > 0
            ) {
              hasFrame = true;
              break;
            }
          }
          if (!hasBorder && !hasOutline && !hasText && !hasGlyph && !hasFrame) {
            out.push(`${element.tagName.toLowerCase()}.${className.split(" ")[0] || "(none)"}`);
          }
        }
        return { problems: [...new Set(out)], seen };
      });
      checked += found.seen;
      expect(found.seen, `${url} showed no controls at all`).toBeGreaterThan(0);
      for (const entry of found.problems) invisible.push(`${url} :: ${entry}`);
    }

    await context.close();
    expect(invisible, invisible.join("\n")).toEqual([]);
    expect(checked, "no control was actually examined").toBeGreaterThan(30);
  });

  // Every focusable control on every built component page must show a focus
  // indicator the platform preserves. A box-shadow does not survive forced
  // colors, so a control whose ring is only a shadow fails here.
  test("every reachable control shows a focus indicator", async ({ browser }) => {
    test.setTimeout(600_000);
    const context = await browser.newContext({ forcedColors: "active" });
    const page = await context.newPage();
    const unfocusable: string[] = [];

    let checked = 0;
    for (const url of componentPages()) {
      const response = await page.goto(`components/${url}`);
      // A page that did not load would report no problems at all.
      expect(response?.ok(), `${url} did not load`).toBeTruthy();
      await page.waitForLoadState("load");
      const found = await page.evaluate(() => {
        const out: string[] = [];
        let seen = 0;
        const selector =
          "button, input, select, textarea, a[href], [tabindex]:not([tabindex='-1'])";
        for (const element of document.querySelectorAll<HTMLElement>(selector)) {
          const className = (element.className || "").toString();
          // The documentation theme's own chrome is not the library under test.
          if (/\bsl-|pagefind|astro-/.test(className)) continue;
          if (element.closest("header, nav.sidebar, .right-sidebar, .copy, .expressive-code"))
            continue;
          if ((element as HTMLInputElement).disabled) continue;
          const box = element.getBoundingClientRect();
          const hidden = box.width < 2 || box.height < 2;
          element.focus();
          if (!element.matches(":focus-visible")) continue;
          // The nearest ancestor that clips, and the box it clips to.
          const clipperOf = (node: Element) => {
            for (let a = node.parentElement; a; a = a.parentElement) {
              const style = getComputedStyle(a);
              if (/(auto|scroll|hidden|clip)/.test(style.overflowX + style.overflowY)) return a;
            }
            return null;
          };
          const ringOn = (node: Element | null | undefined) => {
            if (!node) return false;
            const style = getComputedStyle(node);
            if (style.outlineStyle === "none" || !(parseFloat(style.outlineWidth) > 0))
              return false;
            // A ring drawn past what an ancestor shows is a ring nobody sees.
            const reach = parseFloat(style.outlineWidth) + parseFloat(style.outlineOffset || "0");
            if (reach <= 0) return true;
            const clipper = clipperOf(node);
            if (!clipper) return true;
            const ring = node.getBoundingClientRect();
            const clip = clipper.getBoundingClientRect();
            const room = 0.5;
            return (
              ring.top - reach >= clip.top - room &&
              ring.bottom + reach <= clip.bottom + room &&
              ring.left - reach >= clip.left - room &&
              ring.right + reach <= clip.right + room
            );
          };
          // A hidden input paints nothing itself, so its ring belongs to the
          // control it stands for: the label around it, or the box next to
          // it. A whole group does not count as the indicator for one item.
          const candidates: (Element | null)[] = hidden
            ? [element.closest("label"), element.nextElementSibling]
            : [element];
          seen += 1;
          const ringed = candidates.some(ringOn);
          if (!ringed) {
            out.push(`${element.tagName.toLowerCase()}.${className.split(" ")[0] || "(none)"}`);
          }
        }
        return { problems: [...new Set(out)], seen };
      });
      checked += found.seen;
      for (const entry of found.problems) unfocusable.push(`${url} :: ${entry}`);
    }

    await context.close();
    expect(unfocusable, unfocusable.join("\n")).toEqual([]);
    // A silent pass is the failure mode here: a stale build, a bad URL list or
    // an over-eager filter would report nothing at all.
    expect(checked, "no control was actually checked").toBeGreaterThan(200);
  });
});

const PAGES_ROOT = "packages/docs/dist/components";

const componentPages = (): string[] => {
  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((entry) => {
      const path = join(dir, entry);
      return statSync(path).isDirectory() ? walk(path) : entry === "index.html" ? [path] : [];
    });
  return walk(PAGES_ROOT).map((path) => relative(PAGES_ROOT, path).replace(/index\.html$/, ""));
};
