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

// Safari only tabs to buttons when the system enables full keyboard access.
const tabReachesButtons = (browserName: string) => browserName !== "webkit";

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

test.describe("Elements dropdown menu", () => {
  test.beforeEach(async ({ page }) => {
    await mount(
      page,
      ["ds-dropdown-menu"],
      `<main>
        <ds-dropdown-menu label="Actions"></ds-dropdown-menu>
        <p>Outside the menu</p>
      </main>`,
    );
    await page.evaluate(() => {
      const menu = document.querySelector("ds-dropdown-menu") as HTMLElement & { items: unknown };
      menu.items = [
        { value: "new", label: "New file" },
        { value: "open", label: "Open" },
        { value: "rename", label: "Rename", disabled: true },
        { value: "duplicate", label: "Duplicate" },
        { value: "delete", label: "Delete" },
      ];
      menu.addEventListener("select", (event) => {
        menu.dataset.selected = (event as CustomEvent<{ value: string }>).detail.value;
      });
    });
  });

  test("opens from the keyboard, moves with arrows and typeahead, and selects", async ({
    page,
  }) => {
    const trigger = page.getByRole("button", { name: "Actions" });
    await trigger.focus();
    await page.keyboard.press("ArrowDown");

    const menu = page.getByRole("menu");
    await expect(menu).toBeVisible();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByRole("menuitem", { name: "New file" })).toBeFocused();

    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("menuitem", { name: "Open" })).toBeFocused();
    // The disabled item is skipped.
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("menuitem", { name: "Duplicate" })).toBeFocused();
    await page.keyboard.press("End");
    await expect(page.getByRole("menuitem", { name: "Delete" })).toBeFocused();
    await page.keyboard.press("Home");
    await expect(page.getByRole("menuitem", { name: "New file" })).toBeFocused();

    await page.keyboard.press("d");
    await expect(page.getByRole("menuitem", { name: "Duplicate" })).toBeFocused();

    await page.keyboard.press("Enter");
    await expect(menu).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect(page.locator("ds-dropdown-menu")).toHaveAttribute("data-selected", "duplicate");
  });

  test("Escape closes and returns focus to the trigger", async ({ page }) => {
    const trigger = page.getByRole("button", { name: "Actions" });
    await trigger.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("menu")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.getByRole("menu")).toBeHidden();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(trigger).toBeFocused();
    await expect(page.locator("ds-dropdown-menu")).not.toHaveAttribute("data-selected");
  });

  test("sits below the trigger inside the viewport and closes on an outside press", async ({
    page,
  }) => {
    const trigger = page.getByRole("button", { name: "Actions" });
    await trigger.click();
    const menu = page.getByRole("menu");
    await expect(menu).toBeVisible();
    await expectBelowInViewport(page, trigger, menu);

    await page.getByText("Outside the menu").click();
    await expect(menu).toBeHidden();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  });
});

test.describe("Elements tooltip", () => {
  test.beforeEach(async ({ page }) => {
    await mount(
      page,
      ["ds-tooltip"],
      `<main>
        <ds-tooltip text="Table settings" open-delay="400">
          <button type="button" aria-label="Settings">S</button>
        </ds-tooltip>
      </main>`,
    );
  });

  test("keyboard focus shows it at once and Escape hides it", async ({ page }) => {
    const button = page.getByRole("button", { name: "Settings" });
    await button.focus();

    const tip = page.getByRole("tooltip");
    await expect(tip).toHaveText("Table settings");
    await expect(button).toHaveAccessibleDescription("Table settings");

    await page.keyboard.press("Escape");
    await expect(tip).toBeHidden();
    await expect(button).not.toHaveAttribute("aria-describedby");
    // The tooltip never takes focus.
    await expect(button).toBeFocused();
  });

  test("hover shows it after the delay and it stays while the pointer is on it", async ({
    page,
  }) => {
    const button = page.getByRole("button", { name: "Settings" });
    await button.hover();
    // The open delay has not run yet.
    expect(await page.evaluate(() => document.querySelector("[role='tooltip']"))).toBeNull();

    const tip = page.getByRole("tooltip");
    await expect(tip).toBeVisible();
    await expect(tip).toHaveText("Table settings");
    const b = (await button.boundingBox())!;
    const t = (await tip.boundingBox())!;
    // Beside the control, never over it (above by default, flipped near the top).
    expect(t.y + t.height <= b.y || t.y >= b.y + b.height).toBe(true);

    // Hoverable (WCAG 1.4.13): moving onto the tooltip keeps it open.
    await tip.hover();
    await expect(tip).toBeVisible();

    await page.mouse.move(0, 0);
    await expect(tip).toBeHidden();
  });
});

test.describe("Elements navigation menu", () => {
  test.beforeEach(async ({ page }) => {
    await mount(
      page,
      ["ds-navigation-menu"],
      `<header><ds-navigation-menu label="Site" open-delay="100"></ds-navigation-menu></header>
      <p>Page content</p>`,
    );
    await page.evaluate(() => {
      (document.querySelector("ds-navigation-menu") as HTMLElement & { items: unknown }).items = [
        { value: "home", label: "Home", href: "#home" },
        {
          value: "products",
          label: "Products",
          links: [
            { label: "Catalog", href: "#catalog", description: "Every table in one place" },
            { label: "Lineage", href: "#lineage" },
          ],
        },
        { value: "docs", label: "Docs", links: [{ label: "Guides", href: "#guides" }] },
      ];
    });
  });

  test("ArrowDown moves into the panel and Escape returns to the trigger", async ({ page }) => {
    const nav = page.getByRole("navigation", { name: "Site" });
    const trigger = nav.getByRole("button", { name: "Products" });
    await trigger.focus();
    await page.keyboard.press("ArrowDown");

    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    const catalog = nav.getByRole("link", { name: /Catalog/ });
    await expect(catalog).toBeFocused();
    await expectBelowInViewport(page, trigger, page.locator(".navmenu__content"));

    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(catalog).toBeHidden();
  });

  test("opens on hover, switches panels at once and closes on an outside press", async ({
    page,
  }) => {
    const nav = page.getByRole("navigation", { name: "Site" });
    const products = nav.getByRole("button", { name: "Products" });
    const docs = nav.getByRole("button", { name: "Docs" });

    await products.hover();
    await expect(products).toHaveAttribute("aria-expanded", "true");
    await docs.hover();
    await expect(docs).toHaveAttribute("aria-expanded", "true");
    await expect(products).toHaveAttribute("aria-expanded", "false");
    await expect(nav.getByRole("link", { name: "Guides" })).toBeVisible();

    await page.getByText("Page content").click();
    await expect(docs).toHaveAttribute("aria-expanded", "false");
    await expect(nav.getByRole("link", { name: "Guides" })).toBeHidden();
  });
});

test.describe("Elements toolbar", () => {
  test.beforeEach(async ({ page }) => {
    await mount(
      page,
      ["ds-toolbar", "ds-button", "ds-separator"],
      `<main>
        <input aria-label="Before" />
        <ds-toolbar label="Text formatting">
          <ds-button>Bold</ds-button>
          <ds-button>Italic</ds-button>
          <ds-button disabled>Underline</ds-button>
          <ds-separator orientation="vertical" decorative></ds-separator>
          <button type="button">Align left</button>
        </ds-toolbar>
        <input aria-label="After" />
      </main>`,
    );
  });

  test("holds one tab stop, moves with the arrows and skips the disabled control", async ({
    page,
    browserName,
  }) => {
    const toolbar = page.getByRole("toolbar", { name: "Text formatting" });
    const bold = toolbar.getByRole("button", { name: "Bold" });
    const italic = toolbar.getByRole("button", { name: "Italic" });
    const align = toolbar.getByRole("button", { name: "Align left" });

    await expect(toolbar.locator("[tabindex='0']")).toHaveCount(1);
    await expect(bold).toHaveAttribute("tabindex", "0");

    if (tabReachesButtons(browserName)) {
      await page.getByRole("textbox", { name: "Before" }).focus();
      await page.keyboard.press("Tab");
      await expect(bold).toBeFocused();
    } else {
      await bold.focus();
    }

    await page.keyboard.press("ArrowRight");
    await expect(italic).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expect(align).toBeFocused();
    // Wraps at the end.
    await page.keyboard.press("ArrowRight");
    await expect(bold).toBeFocused();
    await page.keyboard.press("End");
    await expect(align).toBeFocused();
    await page.keyboard.press("ArrowLeft");
    await expect(italic).toBeFocused();
    await expect(toolbar.locator("[tabindex='0']")).toHaveCount(1);
    await expect(italic).toHaveAttribute("tabindex", "0");

    if (tabReachesButtons(browserName)) {
      // One Tab leaves the toolbar; Shift+Tab comes back to the last control used.
      await page.keyboard.press("Tab");
      await expect(page.getByRole("textbox", { name: "After" })).toBeFocused();
      await page.keyboard.press("Shift+Tab");
      await expect(italic).toBeFocused();
    }
  });
});

test.describe("Elements overlays at 320 CSS pixels", () => {
  test.use({ viewport: { width: 320, height: 640 } });

  test("the dropdown and navigation panels stay inside the viewport", async ({ page }) => {
    await mount(
      page,
      ["ds-dropdown-menu", "ds-navigation-menu"],
      `<main>
        <ds-navigation-menu label="Site"></ds-navigation-menu>
        <ds-dropdown-menu label="Actions"></ds-dropdown-menu>
      </main>`,
    );
    await page.evaluate(() => {
      (document.querySelector("ds-navigation-menu") as HTMLElement & { items: unknown }).items = [
        {
          value: "products",
          label: "Products",
          links: [{ label: "Catalog", href: "#catalog", description: "Every table in one place" }],
        },
      ];
      (document.querySelector("ds-dropdown-menu") as HTMLElement & { items: unknown }).items = [
        { value: "export", label: "Export the current selection as a file" },
      ];
    });

    const products = page.getByRole("button", { name: "Products" });
    await products.focus();
    await page.keyboard.press("Enter");
    await expectBelowInViewport(page, products, page.locator(".navmenu__content"));
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      320,
    );
    await page.keyboard.press("Escape");
    await expect(products).toHaveAttribute("aria-expanded", "false");

    const actions = page.getByRole("button", { name: "Actions" });
    await actions.click();
    await expectBelowInViewport(page, actions, page.getByRole("menu"));
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      320,
    );
  });
});
