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

test("the whole catalog is free of automated accessibility violations", async ({ page }) => {
  test.setTimeout(600_000);
  const failures: string[] = [];

  for (const url of allPages()) {
    await page.goto(url);
    await page.waitForLoadState("load");
    // Expressive Code settles its scrollable-block attributes on idle.
    await page.waitForTimeout(400);
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
  await page.waitForTimeout(600);

  const state = () =>
    page.evaluate(() =>
      [...document.querySelectorAll(".expressive-code pre")].map((pre) => ({
        scrolls: pre.scrollWidth > pre.clientWidth,
        focusable: pre.getAttribute("tabindex") !== null,
        role: pre.getAttribute("role"),
        named: pre.getAttribute("aria-label") !== null,
      })),
    );

  const wide = await state();
  expect(wide.length).toBeGreaterThan(1);
  for (const block of wide) {
    expect(block.focusable, "a scrolling block must be reachable").toBe(block.scrolls);
    expect(block.named, "a reachable block must be named").toBe(block.scrolls);
    expect(block.role).toBe(block.scrolls ? "group" : null);
  }

  // Narrow enough that blocks which fit at desktop start scrolling.
  await page.setViewportSize({ width: 380, height: 900 });
  await page.waitForTimeout(800);
  const narrow = await state();
  expect(narrow.some((block) => block.scrolls)).toBe(true);
  for (const block of narrow) {
    expect(block.focusable).toBe(block.scrolls);
    expect(block.named).toBe(block.scrolls);
    expect(block.role).toBe(block.scrolls ? "group" : null);
  }
});
