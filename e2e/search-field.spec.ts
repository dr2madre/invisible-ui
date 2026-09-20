import { expect, test } from "@playwright/test";
import { VUE_BASE } from "../playwright.config";

const PAGE = "components/forms/search-field/";

test.beforeEach(async ({ page }) => {
  await page.goto(PAGE);
  await expect(page.getByRole("searchbox", { name: "Search tables and columns" })).toBeVisible();
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
