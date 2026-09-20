import { expect, test } from "@playwright/test";
import { VUE_BASE } from "../playwright.config";

const ELEMENTS_BASE = VUE_BASE.replace("harness.html", "elements-harness.html");

test.beforeEach(async ({ page }) => {
  await page.goto(ELEMENTS_BASE);
  await page.evaluate(async () => {
    await customElements.whenDefined("ds-checkbox");
    const checkbox = document.createElement("ds-checkbox");
    checkbox.setAttribute("label", "Protection");
    checkbox.setAttribute("data-testid", "state-checkbox");
    document.body.append(checkbox);
  });
});

test("an Elements checkbox paints exactly the glyph for its current state", async ({ page }) => {
  const host = page.getByTestId("state-checkbox");
  const input = page.getByRole("checkbox", { name: "Protection" });
  const check = host.locator("svg.checkbox__check");
  const dash = host.locator("svg.checkbox__dash");

  await expect(check).toHaveCount(1);
  await expect(dash).toHaveCount(1);
  await expect(check).toHaveCSS("display", "none");
  await expect(dash).toHaveCSS("display", "none");

  await host.evaluate((node) => {
    (node as HTMLElement & { checked: boolean | "indeterminate" }).checked = true;
  });
  await expect(input).toBeChecked();
  await expect(check).toHaveCSS("display", "block");
  await expect(dash).toHaveCSS("display", "none");

  await host.evaluate((node) => {
    (node as HTMLElement & { checked: boolean | "indeterminate" }).checked = "indeterminate";
  });
  await expect(input).not.toBeChecked();
  expect(await input.evaluate((node: HTMLInputElement) => node.indeterminate)).toBe(true);
  await expect(check).toHaveCSS("display", "none");
  await expect(dash).toHaveCSS("display", "block");

  await host.evaluate((node) => {
    (node as HTMLElement & { checked: boolean | "indeterminate" }).checked = false;
  });
  await expect(input).not.toBeChecked();
  expect(await input.evaluate((node: HTMLInputElement) => node.indeterminate)).toBe(false);
  await expect(check).toHaveCSS("display", "none");
  await expect(dash).toHaveCSS("display", "none");
});
