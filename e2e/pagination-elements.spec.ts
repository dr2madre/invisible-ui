import { expect, test } from "@playwright/test";
import { VUE_BASE } from "../playwright.config";

const openFixture = async (page: import("@playwright/test").Page) => {
  await page.goto(VUE_BASE.replace("harness.html", "elements-harness.html"));
  await page.evaluate(async () => {
    await customElements.whenDefined("ds-pagination");
    document.body.innerHTML = `
      <ds-pagination page="5" page-count="20" label="Catalog pages"></ds-pagination>
    `;
    const pagination = document.querySelector("ds-pagination")!;
    pagination.addEventListener("change", (event) => {
      pagination.setAttribute(
        "data-reported-page",
        String((event as CustomEvent<{ page: number }>).detail.page),
      );
    });
  });
};

test("Elements Pagination preserves focus and reports the committed page", async ({ page }) => {
  await openFixture(page);
  const pageSix = page.getByRole("button", { name: "Go to page 6" });
  await pageSix.click();
  await expect(pageSix).toBeFocused();
  await expect(pageSix).toHaveAttribute("aria-current", "page");
  await expect(page.locator("ds-pagination")).toHaveAttribute("data-reported-page", "6");

  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("button", { name: "Go to page 7" })).toBeFocused();
});

test("Elements Pagination stays reachable without page overflow at 320 CSS pixels", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await openFixture(page);
  const navigation = page.getByRole("navigation", { name: "Catalog pages" });
  await expect(navigation).toBeVisible();
  await navigation.getByRole("button", { name: "Go to next page" }).focus();
  await expect(navigation.getByRole("button", { name: "Go to next page" })).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});
