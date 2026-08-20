import { expect, test, type Page } from "@playwright/test";
import { VUE_BASE } from "../playwright.config";

// The React and Elements harness pages live on the same Vite server as the
// Vue harness, one page per adapter.
const REACT_BASE = VUE_BASE.replace("harness.html", "react-harness.html");
const ELEMENTS_BASE = VUE_BASE.replace("harness.html", "elements-harness.html");

const input = (page: Page) => page.getByRole("combobox", { name: "Skills" });

test.describe("React MultiSelect (harness)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(REACT_BASE);
  });

  test("keyboard selection, focus chain and Backspace parity", async ({ page }) => {
    await input(page).focus();
    await page.keyboard.press("ArrowDown");
    const active = await input(page).getAttribute("aria-activedescendant");
    expect(active).toBeTruthy();
    expect(await page.locator(`#${active}`).count()).toBe(1);
    await page.keyboard.press("Enter");
    await expect(input(page)).toBeFocused();
    await expect(input(page)).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByTestId("values-readout")).toHaveText("Values: vue, svelte");

    // Removal focus chain: next remove button, then previous, then the input.
    const removeVue = page.getByRole("button", { name: "Remove Vue" });
    await removeVue.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("button", { name: "Remove Svelte" })).toBeFocused();
    await input(page).focus();
    await page.keyboard.press("Backspace");
    await expect(page.getByTestId("values-readout")).toHaveText("Values: none");
  });

  test("controlled reflection overwrites without a callback loop", async ({ page }) => {
    await page.getByRole("button", { name: "Reflect selection" }).click();
    await expect(page.getByTestId("values-readout")).toHaveText("Values: elements, svelte");
    await expect(page.getByRole("button", { name: "Remove Elements" })).toBeVisible();
    // The disabled option adds nothing; FormData keeps selection order.
    await input(page).click();
    await page.getByRole("option", { name: "React", exact: true }).click({ force: true });
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Submit skills" }).click();
    await expect(page.getByTestId("skills-readout")).toHaveText("Submitted: elements, svelte");
  });
});

test.describe("Elements <ds-multi-select> (harness)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ELEMENTS_BASE);
  });

  test("upgrades in light DOM and works with the keyboard", async ({ page }) => {
    // Light DOM: no shadow root anywhere on the host.
    expect(
      await page.evaluate(() => document.querySelector("ds-multi-select")?.shadowRoot === null),
    ).toBe(true);

    await input(page).focus();
    await page.keyboard.press("ArrowDown");
    const active = await input(page).getAttribute("aria-activedescendant");
    expect(active).toBeTruthy();
    expect(await page.locator(`#${active}`).count()).toBe(1);
    await page.keyboard.press("Enter");
    await expect(input(page)).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByTestId("events-readout")).toHaveText("Events: vue, svelte");

    // Removal focus chain and Backspace (opted in via the attribute).
    const removeVue = page.getByRole("button", { name: "Remove Vue" });
    await removeVue.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("button", { name: "Remove Svelte" })).toBeFocused();
    await input(page).focus();
    await page.keyboard.press("Backspace");
    await expect(page.getByTestId("events-readout")).toHaveText("Events: empty");
  });

  test("post-mount property and attribute changes reflect both ways", async ({ page }) => {
    // Property write: reflected to the attribute, no change event.
    await page.getByTestId("reflect").click();
    await expect(page.getByTestId("values-readout")).toHaveText("Values: elements, svelte");
    expect(
      await page.evaluate(() => document.querySelector("ds-multi-select")?.getAttribute("values")),
    ).toBe("elements svelte");
    await expect(page.getByTestId("events-readout")).toHaveText("Events: none");

    // Attribute write: reflected to the property, still no event.
    await page.evaluate(() =>
      document.querySelector("ds-multi-select")?.setAttribute("values", "react"),
    );
    expect(
      await page.evaluate(
        () => (document.querySelector("ds-multi-select") as unknown as { values: string[] }).values,
      ),
    ).toEqual(["react"]);
    await expect(page.getByTestId("events-readout")).toHaveText("Events: none");
  });

  test("submits repeated hidden inputs in selection order", async ({ page }) => {
    await input(page).click();
    await page.getByRole("option", { name: "Elements" }).click();
    await page.keyboard.press("Escape");
    const hidden = await page.evaluate(() =>
      Array.from(document.querySelectorAll("input[type=hidden][name=skills]")).map(
        (node) => (node as HTMLInputElement).value,
      ),
    );
    expect(hidden).toEqual(["vue", "elements"]);
    await page.getByRole("button", { name: "Submit skills" }).click();
    await expect(page.getByTestId("skills-readout")).toHaveText("Submitted: vue, elements");
  });

  test("touch selects options and removes tags, in RTL too", async ({ browser }) => {
    const context = await browser.newContext({ hasTouch: true });
    const page = await context.newPage();
    await page.goto(ELEMENTS_BASE);
    await page.evaluate(() => document.documentElement.setAttribute("dir", "rtl"));
    await input(page).tap();
    await page.getByRole("option", { name: "Elements" }).tap();
    await expect(page.getByRole("button", { name: "Remove Elements" })).toBeVisible();
    await page.getByRole("button", { name: "Remove Elements" }).tap();
    await expect(page.getByRole("button", { name: "Remove Elements" })).toHaveCount(0);
    await expect(page.getByTestId("events-readout")).toHaveText("Events: vue");
    await context.close();
  });

  test("wraps at 320px and keeps usable remove targets", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await input(page).click();
    await page.getByRole("option", { name: "Elements" }).click();
    await page.getByRole("option", { name: "Svelte" }).click();
    await page.keyboard.press("Escape");
    const noOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    );
    expect(noOverflow).toBe(true);
    const box = await page.getByRole("button", { name: "Remove Vue" }).boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(24);
    expect(box!.height).toBeGreaterThanOrEqual(24);
  });
});
