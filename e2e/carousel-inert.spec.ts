import { expect, test } from "@playwright/test";
import { VUE_BASE } from "../playwright.config";

// A slide the user cannot see is hidden from assistive technology. Anything
// focusable inside it has to be unreachable too, or a keyboard user lands on
// content that is not there.

test("a link inside an off-screen slide cannot take focus", async ({ page }) => {
  await page.goto(VUE_BASE);
  const visible = page.getByTestId("slide-link-0");
  await expect(visible).toBeVisible();

  // The visible slide's link behaves normally.
  await visible.focus();
  await expect(visible).toBeFocused();

  // The off-screen one refuses focus: `inert` makes the browser skip it, so
  // focus stays where it was.
  const focusedAfter = await page.evaluate(() => {
    const link = document.querySelector("[data-testid='slide-link-1']") as HTMLElement;
    link.focus();
    return document.activeElement?.getAttribute("data-testid") ?? document.activeElement?.tagName;
  });
  expect(focusedAfter).not.toBe("slide-link-1");

  // And the slide really is marked both ways.
  const marks = await page.evaluate(() => {
    const slide = document.querySelectorAll(".carousel__slide")[1] as HTMLElement;
    return { inert: slide.inert, ariaHidden: slide.getAttribute("aria-hidden") };
  });
  expect(marks).toEqual({ inert: true, ariaHidden: "true" });
});
