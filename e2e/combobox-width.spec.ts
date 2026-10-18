import { expect, test, type Locator, type Page } from "@playwright/test";
import { VUE_BASE } from "../playwright.config";

// The Combobox width modes, measured on rendered pages. In the fixed and
// fill modes the input takes the room the control leaves after its icons
// and buttons. In the wrap mode the control is at least as wide as its
// longest option or its placeholder. The adapters share the stylesheet and
// the markup, including the hidden sizer that only the wrap mode uses.

const REACT_BASE = VUE_BASE.replace("harness.html", "react-harness.html");
const ELEMENTS_BASE = VUE_BASE.replace("harness.html", "elements-harness.html");

/**
 * The input's width, and the width the control leaves it after the leading
 * icon, the clear button (its slot stays reserved while hidden) and the
 * chevron. Nothing else may take room in the row.
 */
function inputRoom(input: Locator) {
  return input.evaluate((node) => {
    const control = node.closest(".combobox__control") as HTMLElement;
    const style = getComputedStyle(control);
    const content =
      control.clientWidth -
      parseFloat(style.paddingInlineStart) -
      parseFloat(style.paddingInlineEnd);
    const others = [
      ...control.querySelectorAll(
        ":scope > :is(.combobox__search, .combobox__clear, .combobox__chevron)",
      ),
    ].filter((child) => child.getBoundingClientRect().width > 0);
    const taken = others.reduce((sum, child) => {
      const own = getComputedStyle(child);
      return (
        sum +
        child.getBoundingClientRect().width +
        parseFloat(own.marginInlineStart) +
        parseFloat(own.marginInlineEnd)
      );
    }, 0);
    const gaps = parseFloat(style.columnGap) * others.length;
    return { input: node.getBoundingClientRect().width, room: content - taken - gaps };
  });
}

/** The control's width and the widest option or placeholder it must fit. */
function wrapFit(input: Locator) {
  return input.evaluate((node) => {
    const root = node.closest(".combobox") as HTMLElement;
    root.dataset.width = "wrap";
    const control = root.querySelector(".combobox__control") as HTMLElement;
    const range = document.createRange();
    const widest = Math.max(
      ...[...root.querySelectorAll(".combobox__sizer > span")].map((line) => {
        range.selectNodeContents(line);
        return range.getBoundingClientRect().width;
      }),
    );
    return { control: control.getBoundingClientRect().width, widest };
  });
}

async function expectInputFillsControl(input: Locator) {
  const { input: width, room } = await inputRoom(input);
  expect(room).toBeGreaterThan(80);
  expect(Math.abs(width - room)).toBeLessThanOrEqual(1);
}

async function expectWrapFitsLongest(input: Locator) {
  const { control, widest } = await wrapFit(input);
  expect(widest).toBeGreaterThan(0);
  expect(control).toBeGreaterThanOrEqual(widest);
}

const docs = (page: Page, name: string) => page.getByRole("combobox", { name });

test.describe("Svelte Combobox (docs demo)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("components/forms/combobox/");
    await expect(docs(page, "Assignee")).toBeVisible();
  });

  test("in the fixed mode the input takes the room the control leaves", async ({ page }) => {
    await expectInputFillsControl(docs(page, "Assignee"));
  });

  test("in the wrap mode the control fits its longest line", async ({ page }) => {
    const priority = docs(page, "Priority");
    await expect(priority.locator("xpath=ancestor::*[@data-width][1]")).toHaveAttribute(
      "data-width",
      "wrap",
    );
    await expectWrapFitsLongest(priority);
    await expectWrapFitsLongest(docs(page, "Assignee"));
  });
});

test.describe("Vue Combobox (harness)", () => {
  test("the fixed mode fills the input; the wrap mode fits the longest line", async ({ page }) => {
    await page.goto(VUE_BASE);
    const input = page.getByRole("combobox", { name: "Reset fruit" });
    await expectInputFillsControl(input);
    await expectWrapFitsLongest(input);
  });
});

test.describe("React Combobox (harness)", () => {
  test("the fixed mode fills the input; the wrap mode fits the longest line", async ({ page }) => {
    await page.goto(REACT_BASE);
    const input = page.getByRole("combobox", { name: "City" });
    await expectInputFillsControl(input);
    await expectWrapFitsLongest(input);
  });
});

test.describe("Elements <ds-combobox> (harness)", () => {
  test("the fixed mode fills the input", async ({ page }) => {
    await page.goto(ELEMENTS_BASE);
    await expectInputFillsControl(page.getByRole("combobox", { name: "City" }));
  });
});
