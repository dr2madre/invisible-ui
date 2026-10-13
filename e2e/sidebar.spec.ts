import { expect, test, type Page } from "@playwright/test";
import { VUE_BASE } from "../playwright.config";

const PAGE = "components/patterns/sidebar/";
const demo = (page: Page) => page.getByRole("navigation", { name: "Example product sidebar" });

test.describe("Sidebar (docs demo)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PAGE);
    await expect(demo(page)).toBeVisible();
  });

  test("walks with Tab, opens a section, and says where you are", async ({ page }) => {
    const sidebar = demo(page);
    await expect(sidebar.getByRole("button", { name: "Home" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    // Navigation, not a menu: destinations are links and buttons inside a
    // list, with no menu roles and nothing taken out of the tab order. Whether
    // Tab then stops on a button is the platform's own setting, and Safari's
    // differs, so the shape is what is held here.
    const shape = await sidebar.evaluate((nav) => {
      const controls = [...nav.querySelectorAll("li > a, li > button, li > * > a")];
      return {
        count: controls.length,
        roles: controls.filter((el) => el.hasAttribute("role")).length,
        removed: controls.filter((el) => el.hasAttribute("tabindex")).length,
      };
    });
    expect(shape.count, "the destinations are links and buttons inside list items").toBeGreaterThan(
      0,
    );
    expect(shape.roles, "a destination was given a role of its own").toBe(0);
    expect(shape.removed, "a destination was taken out of the tab order").toBe(0);

    const reports = sidebar.getByRole("button", { name: "Reports" });
    await expect(reports).toHaveAttribute("aria-expanded", "false");
    await reports.press("Enter");
    await expect(reports).toHaveAttribute("aria-expanded", "true");
    await expect(sidebar.getByRole("button", { name: "Daily" })).toBeVisible();
  });

  test("collapses to a rail that keeps every name, and comes back", async ({ page }) => {
    const sidebar = demo(page);
    const toggle = sidebar.getByRole("button", { name: "Collapse the navigation" });
    await expect(toggle).toHaveAttribute("aria-pressed", "false");

    await toggle.click();
    const expand = sidebar.getByRole("button", { name: "Expand the navigation" });
    await expect(expand).toHaveAttribute("aria-pressed", "true");
    // The names are out of sight, and still every destination has one.
    const item = sidebar.getByRole("button", { name: "Search" });
    await expect(item).toBeAttached();
    expect(
      await item.evaluate((el) => {
        const label = el.querySelector("span:last-child") as HTMLElement;
        return { width: label.getBoundingClientRect().width, text: label.textContent };
      }),
      "the name is still there, and takes no room",
    ).toEqual({ width: 1, text: "Search" });

    // And every destination still shows something: a rail of controls with a
    // name and nothing to see would be worse than no rail at all.
    const shown = await sidebar.evaluate((nav) =>
      [...nav.querySelectorAll(".sidebar__item")]
        // Only what the rail actually shows: a closed section's destinations
        // are in the page but not on it.
        .filter((entry) => entry.getBoundingClientRect().width > 0)
        .map((entry) => {
          const glyph = entry.querySelector("svg")?.getBoundingClientRect();
          return {
            name: entry.textContent?.trim(),
            shows: Boolean(glyph && glyph.width > 0 && glyph.height > 0),
          };
        }),
    );
    expect(shown.length, "the rail shows no destinations at all").toBeGreaterThan(0);
    expect(shown, "a destination in the rail with nothing to show").toEqual(
      shown.map(({ name }) => ({ name, shows: true })),
    );

    await expand.click();
    await expect(sidebar.getByRole("button", { name: "Collapse the navigation" })).toBeVisible();
  });

  test("reads a badge in the name, and keeps an unavailable item focusable and inert", async ({
    page,
  }) => {
    const sidebar = demo(page);
    // Chromium reads a space before the visually hidden badge text.
    const alerts = sidebar.getByRole("button", { name: /^Alerts\s?, 3 unread$/ });
    await expect(alerts.locator(".sidebar__badge")).toHaveText("3");
    await expect(alerts.locator(".sidebar__badge")).toBeVisible();

    const billing = sidebar.getByRole("button", { name: "Billing" });
    const reason = "Ask an administrator for access";
    await expect(billing).toHaveAttribute("aria-disabled", "true");
    await expect(billing).toHaveAccessibleDescription(reason);
    await expect(sidebar.getByText(reason)).toBeVisible();
    await billing.focus();
    await expect(billing, "an unavailable item stays in the tab order").toBeFocused();
    // Forced: Playwright refuses to click an element it reads as disabled.
    await billing.click({ force: true });
    await page.keyboard.press("Enter");
    await expect(billing).not.toHaveAttribute("aria-current", "page");
    await expect(sidebar.getByRole("button", { name: "Home" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  test("puts the badge on the icon in the rail and marks the current item by shape", async ({
    page,
  }) => {
    const sidebar = demo(page);
    await sidebar.getByRole("button", { name: "Collapse the navigation" }).click();
    const alerts = sidebar.getByRole("button", { name: /^Alerts\s?, 3 unread$/ });
    const placed = await alerts.evaluate((item) => {
      const icon = item.querySelector(".sidebar__icon")!.getBoundingClientRect();
      const badge = item.querySelector(".sidebar__badge")!.getBoundingClientRect();
      return {
        visible: badge.width > 0 && badge.height > 0,
        endSide: badge.left > icon.left + icon.width / 2,
        topHalf: badge.top < icon.top + icon.height / 2,
        inside: badge.right <= item.closest("nav")!.getBoundingClientRect().right,
      };
    });
    expect(placed).toEqual({ visible: true, endSide: true, topHalf: true, inside: true });
    const mark = await sidebar
      .getByRole("button", { name: "Home" })
      .evaluate((item) => getComputedStyle(item, "::before").borderInlineStartWidth);
    expect(mark, "the current item in the rail has a mark besides its colour").toBe("3px");
  });

  test("wraps the labels and the reason at twice the text size in 320 pixels", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
    const sidebar = demo(page);
    await expect(sidebar).toBeVisible();
    const measured = await sidebar.evaluate((nav) => {
      const reason = nav.querySelector<HTMLElement>(".sidebar__reason")!;
      const labels = [...nav.querySelectorAll<HTMLElement>(".sidebar__label")];
      return {
        clipped: labels
          .filter((label) => label.scrollWidth > label.clientWidth + 1)
          .map((label) => label.textContent),
        reasonWraps:
          reason.getBoundingClientRect().height > parseFloat(getComputedStyle(reason).fontSize) * 2,
      };
    });
    expect(measured.clipped, "a label is cut").toEqual([]);
    expect(measured.reasonWraps, "the reason wraps onto more lines").toBe(true);
  });

  test("fits a 320px viewport without scrolling the page sideways", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await expect(demo(page)).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      ),
    ).toBe(true);
  });
});

test.describe("Sidebar as a drawer (Vue harness)", () => {
  const ELEMENTS_BASE = VUE_BASE;

  test.beforeEach(async ({ page }) => {
    await page.goto(ELEMENTS_BASE);
  });

  test("traps focus, closes on Escape, and gives focus back to the page's own button", async ({
    page,
  }) => {
    const opener = page.getByTestId("sidebar-opener");
    await opener.click();

    const drawer = page.getByRole("dialog");
    await expect(drawer).toBeVisible();
    await expect(drawer).toHaveAccessibleName("Harness navigation");
    await expect(page.getByRole("navigation", { name: "Harness navigation" })).toBeVisible();

    // Focus moved into the panel, which is what makes the trap and the return
    // meaningful.
    expect(
      await page.evaluate(() => document.querySelector("dialog")?.contains(document.activeElement)),
      "focus never reached the panel",
    ).toBe(true);

    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();
    await expect(opener, "focus went back to the button that opened it").toBeFocused();
  });

  test("returns focus to the named button when nothing else opened it", async ({ page }) => {
    // The button that opens it here gives up focus first, so returning focus
    // to "whatever held it" would land on nothing.
    await page.getByTestId("sidebar-open-elsewhere").click();
    await expect(page.getByRole("dialog")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(page.getByTestId("sidebar-opener")).toBeFocused();
  });

  test("closes when a destination is followed", async ({ page }) => {
    await page.getByTestId("sidebar-opener").click();
    await expect(page.getByRole("dialog")).toBeVisible();

    await page.getByRole("button", { name: "Reports overview" }).click();
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(page.getByTestId("sidebar-readout")).toHaveText("Chosen: reports");
  });
});
