import { expect, test, type Page } from "@playwright/test";
import { VUE_BASE } from "../playwright.config";

// Real-browser contract for the Number Field: locale typing and paste, caret
// preservation, spin behavior, wheel safety, commit formatting, and the
// canonical form payload. Runs against the Vue example harness; the Svelte
// docs demo is covered by number-field-docs.spec.ts.

const price = (page: Page) => page.getByRole("spinbutton", { name: "Price" });

// Group separators for four-digit integers vary per engine ICU in it-IT, so
// formatted expectations are derived in the page, never hardcoded.
const formatted = (page: Page, value: number) =>
  page.evaluate(
    (v) => new Intl.NumberFormat("it-IT", { maximumFractionDigits: 15 }).format(v),
    value,
  );

test.beforeEach(async ({ page }) => {
  await page.goto(VUE_BASE);
  await expect(price(page)).toBeVisible();
});

test("renders the localized initial value and accepts comma-decimal typing", async ({ page }) => {
  const input = price(page);
  await expect(input).toHaveValue(await formatted(page, 1234.5));
  await input.fill("");
  await input.pressSequentially("12,5");
  await expect(input).toHaveValue("12,5");
  await input.blur();
  await expect(input).toHaveValue("12,5");
  await expect(page.getByTestId("price-committed")).toHaveText("Committed: 12.5");
});

test("keeps the caret in place during a transient edit", async ({ page }) => {
  const input = price(page);
  await input.fill("");
  await input.pressSequentially("1250");
  // Move the caret between 12 and 50, then type the decimal separator.
  await input.press("ArrowLeft");
  await input.press("ArrowLeft");
  await input.pressSequentially(",");
  await expect(input).toHaveValue("12,50");
  const caret = await input.evaluate((el) => (el as HTMLInputElement).selectionStart);
  expect(caret).toBe(3);
});

test("pastes grouped locale text and commits the canonical value", async ({ page }) => {
  const input = price(page);
  await input.fill("");
  await input.fill("9.876,5");
  await input.press("Enter");
  await expect(page.getByTestId("price-committed")).toHaveText("Committed: 9876.5");
  await expect(input).toHaveValue(await formatted(page, 9876.5));
});

test("steps with arrows and buttons while focus stays in the input", async ({ page }) => {
  const input = price(page);
  await input.click();
  await input.press("ArrowUp");
  await expect(input).toHaveValue(await formatted(page, 1235));
  await page.getByRole("button", { name: "Increase Price" }).click();
  await expect(input).toHaveValue(await formatted(page, 1235.5));
  await expect(input).toBeFocused();
  await page.getByRole("button", { name: "Decrease Price" }).click();
  await expect(input).toHaveValue(await formatted(page, 1235));
  await expect(input).toBeFocused();
});

test("submits the canonical ASCII value and restores on reset", async ({ page }) => {
  await page.getByRole("button", { name: "Submit price" }).click();
  await expect(page.getByTestId("price-submitted")).toHaveText("Submitted: 1234.5");
  const input = price(page);
  await input.fill("77");
  await page.getByRole("button", { name: "Reset price" }).click();
  await expect(input).toHaveValue(await formatted(page, 1234.5));
  await page.getByRole("button", { name: "Submit price" }).click();
  await expect(page.getByTestId("price-submitted")).toHaveText("Submitted: 1234.5");
});

test("keeps an unparseable draft as typed and reports it", async ({ page }) => {
  const input = price(page);
  // Two decimal separators cannot parse in it-IT (dots are group separators).
  await input.fill("1,,2");
  await input.blur();
  await expect(input).toHaveValue("1,,2");
  await expect(input).toHaveAttribute("aria-invalid", "true");
});

test("the wheel scrolls the page by default and steps only with the opt-in", async ({ page }) => {
  const plain = page.getByRole("spinbutton", { name: "Plain amount" });
  await plain.click();
  await plain.hover();
  const before = await page.evaluate(() => window.scrollY);
  await page.mouse.wheel(0, 240);
  await expect(plain).toHaveValue("3");
  const after = await page.evaluate(() => window.scrollY);
  expect(after).toBeGreaterThanOrEqual(before);

  const wheel = page.getByRole("spinbutton", { name: "Wheel amount" });
  await wheel.click();
  await wheel.hover();
  await page.mouse.wheel(0, -120);
  await expect(wheel).toHaveValue("4");
  // Hovered but unfocused: the opt-in field must not steal the wheel either.
  await price(page).click();
  await wheel.hover();
  await page.mouse.wheel(0, -120);
  await expect(wheel).toHaveValue("4");
});

test("spinbutton semantics are truthful in the accessibility tree", async ({ page }) => {
  const input = price(page);
  await expect(input).toHaveAttribute("role", "spinbutton");
  await expect(input).toHaveAttribute("inputmode", "decimal");
  await expect(input).toHaveAttribute("aria-valuemin", "0");
  await expect(input).toHaveAttribute("aria-valuenow", "1234.5");
  await expect(input).toHaveAttribute("aria-valuetext", await formatted(page, 1234.5));
  const increase = page.getByRole("button", { name: "Increase Price" });
  await expect(increase).toHaveAttribute("tabindex", "-1");
});

test("stays usable at 320 CSS pixels", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  const input = price(page);
  await input.scrollIntoViewIfNeeded();
  await expect(input).toBeVisible();
  await page.getByRole("button", { name: "Increase Price" }).click();
  await expect(input).toHaveValue(await formatted(page, 1235));
  // The field itself must fit the narrow viewport (other harness sections
  // have their own width contracts).
  const box = await page.getByTestId("price-form").boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x + box!.width).toBeLessThanOrEqual(320);
});
