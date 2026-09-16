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

    // Navigation, not a menu: no destination is taken out of the tab order,
    // which is what a roving tabindex would do. Whether Tab then stops on a
    // button is the platform's own setting, and Safari's differs.
    expect(
      await sidebar.evaluate((nav) =>
        [...nav.querySelectorAll("a, button")].some((el) => el.hasAttribute("tabindex")),
      ),
      "a destination was taken out of the tab order",
    ).toBe(false);

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
    await expect(sidebar.getByRole("button", { name: "Search" })).toBeAttached();
    expect(
      await sidebar.getByRole("button", { name: "Search" }).evaluate((el) => el.clientWidth),
      "a name out of sight takes no room",
    ).toBeLessThan(50);

    await expand.click();
    await expect(sidebar.getByRole("button", { name: "Collapse the navigation" })).toBeVisible();
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
