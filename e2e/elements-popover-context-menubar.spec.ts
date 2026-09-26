import { expect, test, type Locator, type Page } from "@playwright/test";
import { VUE_BASE } from "../playwright.config";

const ELEMENTS_BASE = VUE_BASE.replace("harness.html", "elements-harness.html");

const mount = async (page: Page, tags: string[], markup: string) => {
  await page.goto(ELEMENTS_BASE);
  await page.evaluate(
    async ({ tags, markup }) => {
      await Promise.all(tags.map((tag) => customElements.whenDefined(tag)));
      document.body.innerHTML = markup;
    },
    { tags, markup },
  );
};

// The floating element sits below its anchor and inside the viewport.
const expectBelowInViewport = async (page: Page, anchor: Locator, floating: Locator) => {
  await expect(async () => {
    const a = (await anchor.boundingBox())!;
    const f = (await floating.boundingBox())!;
    const viewport = page.viewportSize()!;
    expect(f.y).toBeGreaterThanOrEqual(a.y + a.height);
    expect(f.x).toBeGreaterThanOrEqual(0);
    expect(f.x + f.width).toBeLessThanOrEqual(viewport.width);
    expect(f.y + f.height).toBeLessThanOrEqual(viewport.height);
  }).toPass();
};

const expectInViewport = async (page: Page, floating: Locator) => {
  await expect(async () => {
    const f = (await floating.boundingBox())!;
    const viewport = page.viewportSize()!;
    expect(f.x).toBeGreaterThanOrEqual(0);
    expect(f.y).toBeGreaterThanOrEqual(0);
    expect(f.x + f.width).toBeLessThanOrEqual(viewport.width);
    expect(f.y + f.height).toBeLessThanOrEqual(viewport.height);
  }).toPass();
};

const noHorizontalScroll = async (page: Page) =>
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    page.viewportSize()!.width,
  );

test.describe("Elements popover", () => {
  test.beforeEach(async ({ page }) => {
    await mount(
      page,
      ["ds-popover"],
      `<main>
        <ds-popover label="Quick settings">
          <span slot="trigger">Settings</span>
          <p>Choose how the list looks.</p>
          <button type="button">Compact rows</button>
        </ds-popover>
        <p>Outside the popover</p>
      </main>`,
    );
  });

  test("opens from the keyboard, moves focus in, and Escape returns it", async ({ page }) => {
    const trigger = page.getByRole("button", { name: "Settings" });
    await trigger.focus();
    await page.keyboard.press("Enter");

    const panel = page.getByRole("dialog", { name: "Quick settings" });
    await expect(panel).toBeVisible();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByRole("button", { name: "Compact rows" })).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(trigger).toBeFocused();
  });

  test("sits below the trigger inside the viewport and closes on an outside press", async ({
    page,
  }) => {
    const trigger = page.getByRole("button", { name: "Settings" });
    await trigger.click();
    const panel = page.getByRole("dialog", { name: "Quick settings" });
    await expect(panel).toBeVisible();
    await expectBelowInViewport(page, trigger, panel);

    await page.getByText("Outside the popover").click();
    await expect(panel).toBeHidden();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  });
});

test.describe("Elements popover in hover mode", () => {
  test.beforeEach(async ({ page }) => {
    await mount(
      page,
      ["ds-popover"],
      `<main>
        <ds-popover trigger="hover" open-delay="200" close-delay="100">
          <a slot="trigger" href="#ada">@ada</a>
          <div><strong>Ada Lovelace</strong><p>Mathematician.</p></div>
        </ds-popover>
        <p><a href="#after">After</a></p>
      </main>`,
    );
  });

  test("previews on hover, stays while the pointer is on the card, and leaves", async ({
    page,
  }) => {
    const link = page.getByRole("link", { name: "@ada" });
    const card = page.locator(".popover__content");
    await link.hover();
    await expect(card).toBeVisible();
    await expectBelowInViewport(page, link, card);

    await card.hover();
    await expect(card).toBeVisible();

    await page.mouse.move(0, 0);
    await expect(card).toBeHidden();
  });

  test("previews on keyboard focus without taking it, and Escape hides it", async ({ page }) => {
    const link = page.getByRole("link", { name: "@ada" });
    const card = page.locator(".popover__content");
    await link.focus();
    await expect(card).toBeVisible();
    await expect(link).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(card).toBeHidden();
    await expect(link).toBeFocused();
  });
});

test.describe("Elements context menu", () => {
  test.beforeEach(async ({ page }) => {
    await mount(
      page,
      ["ds-context-menu"],
      `<main>
        <button type="button">Before</button>
        <ds-context-menu label="Page actions">
          <div class="region">Right-click here</div>
        </ds-context-menu>
        <p>Outside the menu</p>
      </main>
      <style>.region { block-size: 8rem; inline-size: 16rem; border: 1px dashed; }</style>`,
    );
    await page.evaluate(() => {
      const menu = document.querySelector("ds-context-menu") as HTMLElement & { items: unknown };
      menu.items = [
        { value: "back", label: "Back" },
        { value: "reload", label: "Reload" },
        { value: "save", label: "Save as", disabled: true },
        { value: "inspect", label: "Inspect" },
      ];
      menu.addEventListener("select", (event) => {
        menu.dataset.selected = (event as CustomEvent<{ value: string }>).detail.value;
      });
    });
  });

  test("opens at the pointer, moves with the keyboard, and selects", async ({ page }) => {
    const region = page.getByText("Right-click here");
    const box = (await region.boundingBox())!;
    await region.click({ button: "right", position: { x: 20, y: 20 } });

    const menu = page.getByRole("menu", { name: "Page actions" });
    await expect(menu).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Back" })).toBeFocused();
    // Anchored at the pointer: the menu starts where the press was.
    await expect(async () => {
      const m = (await menu.boundingBox())!;
      expect(Math.abs(m.x - (box.x + 20))).toBeLessThanOrEqual(4);
      expect(Math.abs(m.y - (box.y + 20))).toBeLessThanOrEqual(4);
    }).toPass();

    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("menuitem", { name: "Reload" })).toBeFocused();
    // The disabled item is skipped.
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("menuitem", { name: "Inspect" })).toBeFocused();
    await page.keyboard.press("b");
    await expect(page.getByRole("menuitem", { name: "Back" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(menu).toBeHidden();
    await expect(page.locator("ds-context-menu")).toHaveAttribute("data-selected", "back");
  });

  test("Escape closes and returns focus to the region the press focused", async ({ page }) => {
    await page.getByText("Right-click here").click({ button: "right" });
    await expect(page.getByRole("menu")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.getByRole("menu")).toBeHidden();
    await expect(page.locator(".context-menu__trigger")).toBeFocused();
  });

  test("the keyboard menu key opens it at the region and Escape returns focus", async ({
    page,
  }) => {
    const region = page.locator(".context-menu__trigger");
    await region.focus();
    // What the menu key and Shift+F10 send: a contextmenu event without a
    // pointer position. Test drivers cannot press the key itself.
    await region.evaluate((node) =>
      node.dispatchEvent(
        new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: 0, clientY: 0 }),
      ),
    );

    const menu = page.getByRole("menu");
    await expect(menu).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Back" })).toBeFocused();
    await expect(async () => {
      const r = (await region.boundingBox())!;
      const m = (await menu.boundingBox())!;
      expect(m.x).toBeGreaterThanOrEqual(r.x);
      expect(m.x).toBeLessThanOrEqual(r.x + r.width);
      expect(m.y).toBeGreaterThanOrEqual(r.y);
      expect(m.y).toBeLessThanOrEqual(r.y + r.height);
    }).toPass();

    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(region).toBeFocused();
  });

  test("closes on an outside press", async ({ page }) => {
    await page.getByText("Right-click here").click({ button: "right" });
    await expect(page.getByRole("menu")).toBeVisible();
    await page.getByText("Outside the menu").click();
    await expect(page.getByRole("menu")).toBeHidden();
  });
});

test.describe("Elements menubar", () => {
  test.beforeEach(async ({ page }) => {
    await mount(
      page,
      ["ds-menubar"],
      `<main>
        <input aria-label="Before" />
        <ds-menubar label="Main"></ds-menubar>
        <p>Outside the bar</p>
      </main>`,
    );
    await page.evaluate(() => {
      const bar = document.querySelector("ds-menubar") as HTMLElement & { menus: unknown };
      bar.menus = [
        {
          value: "file",
          label: "File",
          items: [
            { value: "new", label: "New" },
            { value: "open", label: "Open" },
            { value: "save", label: "Save", disabled: true },
          ],
        },
        {
          value: "edit",
          label: "Edit",
          items: [
            { value: "undo", label: "Undo" },
            { value: "redo", label: "Redo" },
          ],
        },
        { value: "view", label: "View", items: [{ value: "zoom", label: "Zoom in" }] },
      ];
      bar.addEventListener("select", (event) => {
        const { menu, value } = (event as CustomEvent<{ menu: string; value: string }>).detail;
        bar.dataset.selected = `${menu}:${value}`;
      });
    });
  });

  test("moves across triggers, switches open menus and selects", async ({ page }) => {
    const bar = page.getByRole("menubar", { name: "Main" });
    const file = bar.getByRole("menuitem", { name: "File" });
    const edit = bar.getByRole("menuitem", { name: "Edit" });
    const view = bar.getByRole("menuitem", { name: "View" });

    await expect(bar.locator("[tabindex='0']")).toHaveCount(1);
    await file.focus();
    await page.keyboard.press("ArrowRight");
    await expect(edit).toBeFocused();
    await page.keyboard.press("End");
    await expect(view).toBeFocused();
    await page.keyboard.press("Home");
    await expect(file).toBeFocused();

    await page.keyboard.press("ArrowDown");
    const fileMenu = page.getByRole("menu", { name: "File" });
    await expect(fileMenu).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "New" })).toBeFocused();
    await expectBelowInViewport(page, file, fileMenu);

    await page.keyboard.press("ArrowRight");
    await expect(fileMenu).toBeHidden();
    await expect(page.getByRole("menu", { name: "Edit" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Undo" })).toBeFocused();

    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(page.getByRole("menu", { name: "Edit" })).toBeHidden();
    await expect(edit).toBeFocused();
    await expect(page.locator("ds-menubar")).toHaveAttribute("data-selected", "edit:redo");
    await expect(edit).toHaveAttribute("tabindex", "0");
  });

  test("Escape returns focus to the trigger; hover switches; outside press closes", async ({
    page,
  }) => {
    const bar = page.getByRole("menubar", { name: "Main" });
    const file = bar.getByRole("menuitem", { name: "File" });
    const view = bar.getByRole("menuitem", { name: "View" });

    await file.click();
    await expect(page.getByRole("menu", { name: "File" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("menu", { name: "File" })).toBeHidden();
    await expect(file).toBeFocused();

    await file.click();
    await view.hover();
    await expect(view).toHaveAttribute("aria-expanded", "true");
    await expect(file).toHaveAttribute("aria-expanded", "false");

    await page.getByText("Outside the bar").click();
    await expect(view).toHaveAttribute("aria-expanded", "false");
    await expect(page.getByRole("menu")).toHaveCount(0);
  });
});

test.describe("Elements popover and menus at 320 CSS pixels", () => {
  test.use({ viewport: { width: 320, height: 640 } });

  test("the popover, context menu and menubar stay inside the viewport", async ({ page }) => {
    await mount(
      page,
      ["ds-popover", "ds-context-menu", "ds-menubar"],
      `<main>
        <ds-menubar label="Main"></ds-menubar>
        <ds-popover>
          <span slot="trigger">Details</span>
          <p>Short details.</p>
        </ds-popover>
        <ds-context-menu><div class="region">Press here</div></ds-context-menu>
      </main>
      <style>.region { block-size: 6rem; inline-size: 100%; }</style>`,
    );
    await page.evaluate(() => {
      (document.querySelector("ds-menubar") as HTMLElement & { menus: unknown }).menus = [
        { value: "file", label: "File", items: [{ value: "export", label: "Export as a file" }] },
      ];
      (document.querySelector("ds-context-menu") as HTMLElement & { items: unknown }).items = [
        { value: "copy", label: "Copy the selected text" },
      ];
    });

    const details = page.getByRole("button", { name: "Details" });
    await details.click();
    await expectBelowInViewport(page, details, page.getByRole("dialog", { name: "Details" }));
    await noHorizontalScroll(page);
    await page.keyboard.press("Escape");

    const file = page.getByRole("menuitem", { name: "File", exact: true });
    await file.click();
    await expectBelowInViewport(page, file, page.getByRole("menu", { name: "File" }));
    await noHorizontalScroll(page);
    await page.keyboard.press("Escape");

    // Near the right edge the menu flips or shifts to stay on screen.
    const region = page.getByText("Press here");
    const box = (await region.boundingBox())!;
    await region.click({ button: "right", position: { x: box.width - 4, y: 10 } });
    await expectInViewport(page, page.getByRole("menu", { name: "Context menu" }));
    await noHorizontalScroll(page);
  });
});
