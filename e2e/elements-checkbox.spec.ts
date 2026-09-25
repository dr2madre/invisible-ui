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

test("Elements field labels hide from view with hide-label and still name the control", async ({
  page,
}) => {
  await page.goto(VUE_BASE.replace("harness.html", "elements-harness.html"));
  await page.evaluate(async () => {
    await customElements.whenDefined("ds-checkbox");
    document.body.innerHTML = `
      <ds-checkbox label="Select all rows" hide-label></ds-checkbox>
      <ds-switch label="Notifications" hide-label></ds-switch>
      <ds-textarea label="Notes" hide-label></ds-textarea>
      <ds-combobox label="Country" hide-label><option value="it">Italy</option></ds-combobox>`;
  });

  for (const [role, name] of [
    ["checkbox", "Select all rows"],
    ["switch", "Notifications"],
    ["textbox", "Notes"],
    ["combobox", "Country"],
  ] as const) {
    await expect(page.getByRole(role, { name })).toBeAttached();
    const label = page.getByText(name, { exact: true });
    const box = await label.boundingBox();
    expect(box === null || (box.width <= 1 && box.height <= 1)).toBe(true);
  }
});
