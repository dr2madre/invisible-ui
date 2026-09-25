import { expect, test, type Page } from "@playwright/test";
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

// What the form would submit, as "name=value" pairs in document order.
const formData = (page: Page, testId: string) =>
  page
    .getByTestId(testId)
    .evaluate((form) =>
      [...new FormData(form as HTMLFormElement)].map(([name, value]) => `${name}=${String(value)}`),
    );

// Every detail.value an element reported for `type`, in order.
const record = (page: Page, selector: string, type: string) =>
  page.locator(selector).evaluate((host, type) => {
    host.addEventListener(type, (event) => {
      const value = String((event as CustomEvent<{ value: unknown }>).detail.value);
      host.setAttribute(
        `data-${type}`,
        [host.getAttribute(`data-${type}`), value].filter(Boolean).join(" "),
      );
    });
  }, type);

test.describe("Elements number field", () => {
  test.beforeEach(async ({ page }) => {
    await mount(
      page,
      ["ds-number-field", "ds-locale-provider"],
      `<ds-locale-provider locale="it">
        <form data-testid="order">
          <ds-number-field label="Amount" name="amount" value="1234.5" min="0" max="10000" step="0.5"></ds-number-field>
          <button type="reset">Reset</button>
        </form>
      </ds-locale-provider>`,
    );
  });

  test("parses the Italian decimal comma and submits the canonical value", async ({ page }) => {
    const input = page.getByRole("spinbutton", { name: "Amount" });
    await record(page, "ds-number-field", "input");
    await record(page, "ds-number-field", "change");
    await expect(input).toHaveValue("1234,5");
    expect(await formData(page, "order")).toEqual(["amount=1234.5"]);

    await input.fill("2345,5");
    await expect(input).toHaveValue("2345,5");
    expect(await formData(page, "order")).toEqual(["amount=2345.5"]);
    // Enter commits and lets the form submit, which the page stops here.
    await page
      .getByTestId("order")
      .evaluate((form) => form.addEventListener("submit", (event) => event.preventDefault()));
    await input.press("Enter");
    await expect(page.locator("ds-number-field")).toHaveAttribute("data-change", "2345.5");

    await input.fill("12345,5");
    await input.blur();
    // Committed text takes the locale's grouping.
    await expect(input).toHaveValue("12.345,5");
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByText("10.000")).toBeVisible();
  });

  test("steps from the keyboard and the buttons, and keeps focus in the input", async ({
    page,
  }) => {
    const input = page.getByRole("spinbutton", { name: "Amount" });
    await input.focus();
    await page.keyboard.press("ArrowUp");
    await expect(input).toHaveValue("1235");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    await expect(input).toHaveValue("1234");
    await page.keyboard.press("End");
    await expect(input).toHaveValue("10.000");
    await expect(page.getByRole("button", { name: "Increase Amount" })).toBeDisabled();
    await page.keyboard.press("Home");
    await expect(input).toHaveValue("0");

    await page.getByRole("button", { name: "Increase Amount" }).click();
    await expect(input).toHaveValue("0,5");
    await expect(input).toBeFocused();
    expect(await formData(page, "order")).toEqual(["amount=0.5"]);
  });

  test("a form reset restores the default and reports nothing", async ({ page }) => {
    const input = page.getByRole("spinbutton", { name: "Amount" });
    await input.fill("77");
    await input.blur();
    await record(page, "ds-number-field", "input");
    await page.getByRole("button", { name: "Reset" }).click();
    await expect(input).toHaveValue("1234,5");
    expect(await formData(page, "order")).toEqual(["amount=1234.5"]);
    await expect(page.locator("ds-number-field")).not.toHaveAttribute("data-input");
  });
});

test.describe("Elements PIN input", () => {
  test.beforeEach(async ({ page }) => {
    await mount(
      page,
      ["ds-pin-input"],
      `<form data-testid="verify">
        <ds-pin-input label="Verification code" name="code" length="4"></ds-pin-input>
        <button type="reset">Reset</button>
      </form>`,
    );
  });

  test("typing advances, Backspace steps back, and the code reaches the form", async ({ page }) => {
    const cells = page.getByRole("group", { name: "Verification code" }).getByRole("textbox");
    await expect(cells).toHaveCount(4);
    await cells.first().click();
    await page.keyboard.type("12");
    await expect(cells.nth(2)).toBeFocused();
    expect(await formData(page, "verify")).toEqual(["code=12"]);

    await page.keyboard.press("Backspace");
    await expect(cells.nth(1)).toBeFocused();
    await expect(cells.nth(1)).toHaveValue("");
    await page.keyboard.type("x");
    await expect(cells.nth(1)).toHaveValue("");
    expect(await formData(page, "verify")).toEqual(["code=1"]);
  });

  test("a paste fills the cells and completes once", async ({ page }) => {
    const cells = page.getByRole("textbox");
    await record(page, "ds-pin-input", "complete");
    await cells.first().click();
    await cells.first().evaluate((cell) => {
      const data = new DataTransfer();
      data.setData("text", "9876");
      // Firefox drops `clipboardData` from the event constructor, so it is
      // defined on the event instead.
      const event = new ClipboardEvent("paste", { bubbles: true, cancelable: true });
      Object.defineProperty(event, "clipboardData", { value: data });
      cell.dispatchEvent(event);
    });
    await expect(cells.nth(3)).toHaveValue("6");
    await expect(cells.nth(3)).toBeFocused();
    await expect(page.locator("ds-pin-input")).toHaveAttribute("data-complete", "9876");
    expect(await formData(page, "verify")).toEqual(["code=9876"]);
  });

  test("a form reset empties the cells again", async ({ page }) => {
    const cells = page.getByRole("textbox");
    await cells.first().click();
    await page.keyboard.type("345");
    await page.getByRole("button", { name: "Reset" }).click();
    await expect(cells.first()).toHaveValue("");
    expect(await formData(page, "verify")).toEqual(["code="]);
  });
});
