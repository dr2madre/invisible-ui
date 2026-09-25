import { expect, test, type Page } from "@playwright/test";
import { VUE_BASE } from "../playwright.config";

const PAGE = "components/forms/search-field/";

// The demos are client:visible islands; typing before hydration is lost.
const hydrated = async (page: Page, name: string) => {
  const input = page.getByRole("searchbox", { name });
  await input.scrollIntoViewIfNeeded();
  await expect(page.locator("astro-island[ssr]").filter({ has: input })).toHaveCount(0);
};

test.beforeEach(async ({ page }) => {
  await page.goto(PAGE);
  await expect(page.getByRole("searchbox", { name: "Search tables and columns" })).toBeVisible();
  await hydrated(page, "Search tables and columns");
});

test("clear is named, keyboard operable and returns focus to the search input", async ({
  page,
}) => {
  const input = page.getByRole("searchbox", { name: "Search tables and columns" });
  const clear = page.getByRole("button", { name: "Clear search" });

  await expect(input).toHaveValue("archive");
  await clear.focus();
  await page.keyboard.press("Space");

  await expect(input).toHaveValue("");
  await expect(input).toBeFocused();
  await expect(clear).toHaveCount(0);
});

test("the embedded search action submits the surrounding native form", async ({ page }) => {
  const input = page.getByRole("searchbox", { name: "Search tables and columns" });
  const search = page.getByRole("search");
  await input.fill("customers");
  await search.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page.getByText("Submitted: customers")).toBeVisible();
});

test("the two actions remain inside the control without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  const control = page.locator(".search-field__control").first();
  const bounds = await control.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(320);

  const search = page.getByRole("search");
  for (const name of ["Clear search", "Search"]) {
    const box = await search.getByRole("button", { name, exact: true }).boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(24);
    expect(box!.height).toBeGreaterThanOrEqual(24);
  }
});

test("Elements exposes the same clear and native submit contract", async ({ page }) => {
  await page.goto(VUE_BASE.replace("harness.html", "elements-harness.html"));
  await page.evaluate(async () => {
    await customElements.whenDefined("ds-search-field");
    document.body.innerHTML = `
      <form role="search">
        <ds-search-field label="Search tables" value="archive"></ds-search-field>
      </form>`;
    document.querySelector("form")!.addEventListener("submit", (event) => {
      event.preventDefault();
      document.body.dataset.submitted = "true";
    });
  });

  const input = page.getByRole("searchbox", { name: "Search tables" });
  await page.getByRole("button", { name: "Clear search" }).click();
  await expect(input).toHaveValue("");
  await expect(input).toBeFocused();

  await input.fill("customers");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page.locator("body")).toHaveAttribute("data-submitted", "true");
});

test("a filter without a submit button updates as you type and still clears", async ({ page }) => {
  await hydrated(page, "Filter tables");
  const input = page.getByRole("searchbox", { name: "Filter tables" });
  const field = page.locator(".search-field--no-submit");
  await expect(field.getByRole("button", { name: "Search", exact: true })).toHaveCount(0);

  await input.fill("aud");
  await expect(page.getByText("1 table", { exact: true })).toBeVisible();

  await field.getByRole("button", { name: "Clear search" }).click();
  await expect(input).toHaveValue("");
  await expect(input).toBeFocused();
  await expect(page.getByText("6 tables", { exact: true })).toBeVisible();
});

test("Elements hides the parts it toggles off", async ({ page }) => {
  await page.goto(VUE_BASE.replace("harness.html", "elements-harness.html"));
  await page.evaluate(async () => {
    await customElements.whenDefined("ds-search-field");
    document.body.innerHTML = `<ds-search-field label="Filter tables" no-submit></ds-search-field>`;
  });

  const host = page.locator("ds-search-field");
  await expect(host.locator(".search-field__clear")).toBeHidden();
  await expect(host.locator(".search-field__submit")).toBeHidden();
  await expect(host.locator(".search-field__icon")).toBeVisible();

  await page.getByRole("searchbox", { name: "Filter tables" }).fill("aud");
  await expect(host.locator(".search-field__clear")).toBeVisible();
});
