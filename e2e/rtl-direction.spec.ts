import { expect, test, type Page } from "@playwright/test";
import { VUE_BASE } from "../playwright.config";

// Right-to-left text in a real browser. The Elements adapter renders the same
// stylesheets as React and Vue, byte for byte, so it stands for the three; the
// Svelte copies are checked on the documentation site below.
const ELEMENTS_BASE = VUE_BASE.replace("harness.html", "elements-harness.html");

const mount = async (page: Page, tags: string[], markup: string) => {
  await page.goto(ELEMENTS_BASE);
  await page.evaluate(
    async ({ tags, markup }) => {
      await Promise.all(tags.map((tag) => customElements.whenDefined(tag)));
      document.documentElement.dir = "rtl";
      document.body.innerHTML = markup;
    },
    { tags, markup },
  );
};

/** The thumb's box inside the track, from its resolved position. */
const thumbWithin = (track: import("@playwright/test").Locator) =>
  track.evaluate((node) => {
    const thumb = getComputedStyle(node, "::after");
    const left = parseFloat(thumb.left);
    const width = parseFloat(thumb.width);
    return { left, right: left + width, track: node.getBoundingClientRect().width };
  });

const centre = (thumb: { left: number; right: number }) => (thumb.left + thumb.right) / 2;

test.describe("Elements, which stands for React and Vue", () => {
  test("a switch thumb stays on the track and moves to the inline end", async ({ page }) => {
    await mount(page, ["ds-switch"], `<ds-switch label="Alerts"></ds-switch>`);
    const track = page.locator(".switch").first();
    const off = await thumbWithin(track);
    expect(centre(off), "off: at the start edge, the right one").toBeGreaterThan(off.track / 2);
    expect(off.right).toBeLessThanOrEqual(off.track);

    await track.click();
    await expect(page.getByRole("switch", { name: "Alerts" })).toBeChecked();
    // The thumb moves in 150ms: wait until it has arrived.
    await expect.poll(async () => centre(await thumbWithin(track))).toBeLessThan(off.track / 2);
    const on = await thumbWithin(track);
    expect(on.left, "on: at the end edge, the left one").toBeGreaterThanOrEqual(0);
    expect(on.right).toBeLessThanOrEqual(on.track);
  });

  test("a sheet slides in from, and is dragged toward, the edge it sits on", async ({ page }) => {
    await mount(
      page,
      ["ds-sheet-dialog"],
      `<ds-sheet-dialog heading="Filters" trigger="Open filters" side="end" draggable>
        <p>Filter controls</p>
      </ds-sheet-dialog>`,
    );
    await page.getByRole("button", { name: "Open filters" }).click();
    const panel = page.locator(".sheet-dialog__panel");
    await expect(panel).toBeVisible();
    // The end edge is the left one: the panel slides in from it and sits there.
    await expect.poll(async () => Math.round((await panel.boundingBox())!.x)).toBe(0);
    expect(await panel.evaluate((node) => getComputedStyle(node).animationName)).toBe(
      "sheet-dialog-in-start",
    );

    const handle = page.locator(".sheet-dialog__handle");
    const grip = (await handle.boundingBox())!;
    const x = grip.x + grip.width / 2;
    const y = grip.y + grip.height / 2;
    // Dragging away from the edge does not move it toward closing.
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + 200, y, { steps: 8 });
    expect(
      await panel.evaluate((node) =>
        parseFloat(node.style.getPropertyValue("--_sheet-drag") || "0"),
      ),
    ).toBe(0);
    await page.mouse.up();
    await expect(panel).toBeVisible();
    // Dragging toward it closes the panel.
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x - 250, y, { steps: 8 });
    await page.mouse.up();
    await expect(panel).toBeHidden();
  });

  test("a released drag snaps back without animating under reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await mount(
      page,
      ["ds-sheet-dialog"],
      `<ds-sheet-dialog heading="Filters" trigger="Open filters" side="bottom" draggable>
        <p>Filter controls</p>
      </ds-sheet-dialog>`,
    );
    await page.getByRole("button", { name: "Open filters" }).click();
    const panel = page.locator(".sheet-dialog__panel");
    await expect(panel).toBeVisible();
    expect(await panel.evaluate((node) => getComputedStyle(node).transitionDuration)).toBe("0s");
    expect(await panel.evaluate((node) => getComputedStyle(node).animationName)).toBe("none");
  });

  test("directional chevrons mirror, and the open ones still point down", async ({ page }) => {
    await mount(
      page,
      ["ds-accordion", "ds-accordion-item", "ds-tree-view", "ds-calendar"],
      `<ds-accordion type="multiple" value="shipping">
        <ds-accordion-item value="shipping" label="Shipping">Ships in 3 days.</ds-accordion-item>
        <ds-accordion-item value="returns" label="Returns">Returns in 30 days.</ds-accordion-item>
      </ds-accordion>
      <ds-tree-view label="Files"></ds-tree-view>
      <ds-calendar value="2026-06-15"></ds-calendar>`,
    );
    await page.evaluate(() => {
      const tree = document.querySelector("ds-tree-view") as HTMLElement & { nodes: unknown };
      tree.nodes = [{ value: "src", children: [{ value: "index" }] }];
    });
    const scale = (selector: string) =>
      page
        .locator(selector)
        .first()
        .evaluate((node) => getComputedStyle(node).scale);

    expect(await scale(".tree__twistie")).toBe("-1 1");
    expect(await scale(".accordion__icon")).toBe("-1 1");
    expect(await scale(".calendar__arrow")).toBe("-1 1");

    // The open accordion turns the other way round, so it ends up pointing down.
    const open = page.locator('.accordion__trigger[data-state="open"] .accordion__icon');
    await expect(open).toHaveCount(1);
    expect(await open.evaluate((node) => getComputedStyle(node).rotate)).toBe("-90deg");

    // Left to right, nothing is mirrored.
    await page.evaluate(() => (document.documentElement.dir = "ltr"));
    expect(await scale(".tree__twistie")).toBe("none");
    expect(await scale(".calendar__arrow")).toBe("none");
  });
});

test.describe("Svelte, on the documentation site", () => {
  // The demos sit in a provider that writes its own `dir`, so every one of them turns over.
  const rtl = (page: Page) =>
    page.evaluate(() => {
      document.documentElement.dir = "rtl";
      for (const node of document.querySelectorAll("[dir]")) node.setAttribute("dir", "rtl");
    });

  test("a switch thumb stays on the track", async ({ page }) => {
    await page.goto("components/forms/switch/", { waitUntil: "networkidle" });
    await rtl(page);
    const track = page.locator(".ds-preview .switch").first();
    const input = page.locator(".ds-preview [role=switch]").first();
    await input.evaluate((node: HTMLInputElement) => {
      if (node.checked) node.click();
    });
    const off = await thumbWithin(track);
    expect(off.right).toBeLessThanOrEqual(off.track);
    await track.click();
    await expect.poll(async () => centre(await thumbWithin(track))).toBeLessThan(off.track / 2);
    const on = await thumbWithin(track);
    expect(on.left).toBeGreaterThanOrEqual(0);
    expect(on.right).toBeLessThanOrEqual(on.track);
  });

  test("the coverflow puts the next slide on the left", async ({ page }) => {
    await page.goto("components/data-layout/carousel/", { waitUntil: "networkidle" });
    await rtl(page);
    const carousel = page.getByRole("group", { name: "Featured destinations", exact: true });
    const centreOf = async (index: number) => {
      const box = await carousel.locator(".carousel__slide").nth(index).boundingBox();
      return box!.x + box!.width / 2;
    };
    await expect.poll(async () => (await centreOf(1)) - (await centreOf(0))).toBeLessThan(0);
  });

  test("a tree twistie mirrors", async ({ page }) => {
    await page.goto("components/patterns/tree-view/", { waitUntil: "networkidle" });
    await rtl(page);
    const twistie = page.locator(".ds-preview .tree__twistie").first();
    await expect(twistie).toBeVisible();
    expect(await twistie.evaluate((node) => getComputedStyle(node).scale)).toBe("-1 1");
  });
});
