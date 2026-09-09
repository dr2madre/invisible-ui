import { expect, test } from "@playwright/test";
import { createRequire } from "node:module";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

// Automated accessibility gate over the whole built docs catalog: axe with the
// WCAG 2.x A/AA rules, plus the duplicate-landmark best practice, which the
// A/AA set does not cover and which several code samples of the same language
// on one page used to trip.
//
// This proves nothing about screen readers, touch or zoom: those need a human.

const AXE = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");

const DIST = "packages/docs/dist";

const allPages = (): string[] => {
  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((entry) => {
      const path = join(dir, entry);
      return statSync(path).isDirectory() ? walk(path) : entry === "index.html" ? [path] : [];
    });
  return walk(DIST).map((path) => relative(DIST, path).replace(/index\.html$/, ""));
};

// axe refuses a runOnly that mixes tags and rule ids, so the duplicate-landmark
// rule is enabled alongside the WCAG tags instead.
const RULES = {
  runOnly: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
  rules: { "landmark-unique": { enabled: true } },
} as const;

interface Violation {
  id: string;
  nodes: number;
  first: string;
}

// These rules read the accessibility tree, which does not vary by engine, so
// one browser is enough for a sweep this wide.
test.skip(({ browserName }) => browserName !== "chromium", "one engine is enough for axe");

test("the whole catalog is free of automated accessibility violations", async ({ page }) => {
  test.setTimeout(600_000);
  const failures: string[] = [];

  for (const url of allPages()) {
    const response = await page.goto(url);
    expect(response?.ok(), `${url} did not load`).toBeTruthy();
    await page.waitForLoadState("load");
    // The demos mount when they scroll into view, so walk the page to the
    // bottom: a demo that never mounts is a demo never checked, and a
    // half-mounted one reports colours it does not really paint.
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight) {
        window.scrollTo(0, y);
        await new Promise((resolve) => requestAnimationFrame(resolve));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForLoadState("networkidle");
    await expect
      .poll(() => page.evaluate(() => document.querySelectorAll("astro-island:empty").length), {
        message: `${url} left islands unmounted`,
      })
      .toBe(0);
    // Expressive Code settles its scrollable-block attributes on idle, and
    // until it has, a sample can still be a landmark. Wait for the state the
    // sweep depends on instead of guessing how long that takes.
    await expect
      .poll(() =>
        page.evaluate(
          () => document.querySelectorAll('.expressive-code pre[role="region"]').length,
        ),
      )
      .toBe(0);
    // Contrast is measured on painted pixels, so the fonts must be in place.
    await page.evaluate(() => document.fonts.ready);
    await page.addScriptTag({ content: AXE });
    const violations = (await page.evaluate(async (rules) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (globalThis as any).axe.run(document, rules);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return result.violations.map((violation: any) => ({
        id: violation.id,
        nodes: violation.nodes.length,
        first: violation.nodes[0]?.target?.join(" ") ?? "",
      }));
    }, RULES)) as Violation[];
    for (const violation of violations) {
      failures.push(`${url} :: ${violation.id} (${violation.nodes}) :: ${violation.first}`);
    }
  }

  expect(failures, failures.join("\n")).toEqual([]);
});

test("a code sample that starts scrolling is named, and stops being named when it fits", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("components/forms/button/");
  await page.waitForLoadState("load");

  const state = () =>
    page.evaluate(() =>
      [...document.querySelectorAll(".expressive-code pre")].map((pre) => ({
        scrolls: pre.scrollWidth > pre.clientWidth,
        focusable: pre.getAttribute("tabindex") !== null,
        role: pre.getAttribute("role"),
        named: pre.getAttribute("aria-label") !== null,
      })),
    );

  // Settled means every block agrees with itself: focusable exactly when it
  // scrolls, named exactly when focusable.
  const settled = (blocks: Awaited<ReturnType<typeof state>>) =>
    blocks.length > 1 &&
    blocks.every((block) => block.focusable === block.scrolls && block.named === block.scrolls);
  await expect.poll(async () => settled(await state())).toBe(true);

  const wide = await state();
  expect(wide.length).toBeGreaterThan(1);
  for (const block of wide) {
    expect(block.focusable, "a scrolling block must be reachable").toBe(block.scrolls);
    expect(block.named, "a reachable block must be named").toBe(block.scrolls);
    expect(block.role).toBe(block.scrolls ? "group" : null);
  }

  // Narrow enough that blocks which fit at desktop start scrolling.
  await page.setViewportSize({ width: 380, height: 900 });
  await expect.poll(async () => settled(await state())).toBe(true);
  const narrow = await state();
  expect(narrow.some((block) => block.scrolls)).toBe(true);
  for (const block of narrow) {
    expect(block.focusable).toBe(block.scrolls);
    expect(block.named).toBe(block.scrolls);
    expect(block.role).toBe(block.scrolls ? "group" : null);
  }

  // And back: a block that stops scrolling gives all three attributes up.
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect.poll(async () => settled(await state())).toBe(true);
  const wideAgain = await state();
  expect(wideAgain.some((block) => !block.scrolls)).toBe(true);
  for (const block of wideAgain) {
    expect(block.focusable).toBe(block.scrolls);
    expect(block.role).toBe(block.scrolls ? "group" : null);
  }
});
