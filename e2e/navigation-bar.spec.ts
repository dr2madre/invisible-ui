import { expect, test, type Page } from "@playwright/test";

// The Navigation Bar demo on the docs site (docs/navigation-bar-spec.md, test
// plan): narrow width at twice the text size, right to left, forced colors,
// and a fixed bar that never covers the focused element.

const PAGE = "components/patterns/navigation-bar/";
const bar = (page: Page) => page.getByRole("navigation", { name: "Example product navigation" });

/**
 * The bar alone on the page, across the full width, as an application places
 * it: the docs layout around the demo would otherwise decide the width. With
 * `fixed`, it sits at the bottom over thirty buttons, the content gets the
 * documented bottom padding and `scroll-padding-block-end`.
 */
const isolate = (page: Page, fixed = false) =>
  bar(page).evaluate((nav, fixed) => {
    const content = document.createElement("main");
    for (let i = 1; i <= 30; i++) {
      const button = document.createElement("button");
      button.textContent = `Content ${i}`;
      button.style.display = "block";
      button.style.margin = "1rem";
      content.append(button);
    }
    document.body.replaceChildren(content, nav);
    if (!fixed) return 0;
    nav.style.position = "fixed";
    nav.style.insetInline = "0";
    nav.style.insetBlockEnd = "0";
    const height = nav.getBoundingClientRect().height;
    document.documentElement.style.scrollPaddingBlockEnd = `${height}px`;
    document.body.style.paddingBlockEnd = `${height}px`;
    return height;
  }, fixed);

test.describe("Navigation Bar (docs demo)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PAGE);
    await expect(bar(page).getByRole("listitem")).toHaveCount(5);
  });

  test("marks the current destination and moves with Tab and the arrows", async ({ page }) => {
    const nav = bar(page);
    const home = nav.getByRole("button", { name: "Home" });
    await expect(home).toHaveAttribute("aria-current", "page");
    await home.focus();
    await page.keyboard.press("ArrowRight");
    await expect(nav.getByRole("button", { name: "Projects" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(nav.getByRole("button", { name: "Projects" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(nav.locator("[aria-current]")).toHaveCount(1);
  });

  test("keeps an unavailable destination focusable and shows its reason on focus", async ({
    page,
  }) => {
    const reports = bar(page).getByRole("button", { name: "Reports" });
    await expect(reports).toHaveAttribute("aria-disabled", "true");
    await bar(page)
      .getByRole("button", { name: /^Alerts/ })
      .focus();
    await page.keyboard.press("ArrowRight");
    await expect(reports).toBeFocused();
    await expect(reports).toHaveAccessibleDescription("Available online only");
    await expect(page.getByText("Available online only")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByText("Available online only")).toBeHidden();
  });

  test("announces a badge that appears, politely", async ({ page }) => {
    const live = bar(page).locator(".navigation-bar__live");
    await expect(live).toHaveAttribute("aria-live", "polite");
    await page.getByLabel("Profile needs attention").uncheck();
    await page.getByLabel("Profile needs attention").check();
    await expect(live).toHaveText("Profile: Needs attention");
  });

  test("fits 320 pixels at twice the text size: labels wrap, nothing clips", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await isolate(page);
    await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
    const measured = await bar(page).evaluate((element) => {
      const labels = [...element.querySelectorAll<HTMLElement>(".navigation-bar__label-text")];
      return {
        clipped: labels
          .filter((label) => label.scrollWidth > label.parentElement!.clientWidth + 1)
          .map((label) => label.textContent),
        wrapped: labels.some(
          (label) =>
            label.getBoundingClientRect().height >
            parseFloat(getComputedStyle(label).lineHeight) * 1.5,
        ),
        ellipsis: labels.some((label) => getComputedStyle(label).textOverflow === "ellipsis"),
      };
    });
    expect(measured.clipped, "a label is cut").toEqual([]);
    expect(measured.wrapped, "a long label wraps onto more lines").toBe(true);
    expect(measured.ellipsis).toBe(false);
    const pageOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(pageOverflow, "the page scrolls sideways").toBeLessThanOrEqual(0);
  });

  test("orders from the right and mirrors the arrows under right to left", async ({ page }) => {
    const nav = bar(page);
    await nav.evaluate((element) => element.setAttribute("dir", "rtl"));
    const home = nav.getByRole("button", { name: "Home" });
    const projects = nav.getByRole("button", { name: "Projects" });
    const [homeBox, projectsBox] = [await home.boundingBox(), await projects.boundingBox()];
    expect(homeBox!.x).toBeGreaterThan(projectsBox!.x);
    await home.focus();
    await page.keyboard.press("ArrowLeft");
    await expect(projects).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expect(home).toBeFocused();
  });

  test("keeps the focused element above a fixed bar with the scroll padding", async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 600 });
    expect(await isolate(page, true)).toBeGreaterThan(0);
    const obscured: string[] = [];
    for (let step = 0; step < 30; step++) {
      await page.keyboard.press("Tab");
      const under = await page.evaluate(() => {
        const active = document.activeElement as HTMLElement | null;
        const nav = document.querySelector<HTMLElement>(".navigation-bar")!;
        if (!active || active === document.body || nav.contains(active)) return null;
        const rect = active.getBoundingClientRect();
        // WCAG 2.4.11 (minimum): the focused element is never entirely hidden.
        return rect.top >= nav.getBoundingClientRect().top ? active.textContent : null;
      });
      if (under) obscured.push(under);
    }
    expect(obscured, "a focused element was entirely under the bar").toEqual([]);
  });

  test("gives every destination 44 by 44 under a coarse pointer", async ({
    browser,
    browserName,
  }) => {
    test.skip(browserName !== "chromium", "mobile emulation is Chromium-only");
    const context = await browser.newContext({
      hasTouch: true,
      isMobile: true,
      viewport: { width: 320, height: 640 },
    });
    const page = await context.newPage();
    await page.goto(PAGE);
    expect(await page.evaluate(() => matchMedia("(pointer: coarse)").matches)).toBe(true);
    const sizes = await bar(page)
      .locator(".navigation-bar__destination")
      .evaluateAll((elements) =>
        elements.map((element) => {
          const rect = element.getBoundingClientRect();
          return [Math.round(rect.width), Math.round(rect.height)];
        }),
      );
    expect(sizes).toHaveLength(5);
    for (const [width, height] of sizes) {
      expect(width).toBeGreaterThanOrEqual(44);
      expect(height).toBeGreaterThanOrEqual(44);
    }
    await context.close();
  });

  test("keeps the current mark and the focus ring under forced colors", async ({
    browser,
    browserName,
  }) => {
    test.skip(browserName !== "chromium", "forced colors emulation is Chromium-only");
    const context = await browser.newContext({ forcedColors: "active" });
    const page = await context.newPage();
    await page.goto(PAGE);
    const nav = bar(page);
    const home = nav.getByRole("button", { name: "Home" });
    await expect(home).toBeVisible();
    const indicator = await home
      .locator(".navigation-bar__indicator")
      .evaluate((element) => getComputedStyle(element).outlineStyle);
    expect(indicator).toBe("solid");
    await nav.getByRole("button", { name: "Projects" }).focus();
    await page.keyboard.press("ArrowLeft");
    const ring = await home.evaluate((element) => getComputedStyle(element).outlineStyle);
    expect(ring).toBe("solid");
    await context.close();
  });
});
