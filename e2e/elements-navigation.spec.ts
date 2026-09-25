import { expect, test } from "@playwright/test";
import { VUE_BASE } from "../playwright.config";

const HOME = "M3 12l9-9 9 9M5 10v10h14V10";

test("Elements Sidebar and Avatar render the shared styles and collapse to a rail", async ({
  page,
}) => {
  await page.goto(VUE_BASE.replace("harness.html", "elements-harness.html"));
  await page.evaluate(async (icon) => {
    await Promise.all([
      customElements.whenDefined("ds-sidebar"),
      customElements.whenDefined("ds-avatar"),
    ]);
    document.body.innerHTML = `
      <ds-sidebar label="Primary" value="home" rail-toggle>
        <ds-avatar slot="footer" name="Ada Lovelace"></ds-avatar>
      </ds-sidebar>`;
    (document.querySelector("ds-sidebar") as HTMLElement & { sections: unknown }).sections = [
      {
        items: [
          { value: "home", label: "Home", icon },
          { value: "sources", label: "Sources", icon },
        ],
      },
    ];
  }, HOME);

  const nav = page.getByRole("navigation", { name: "Primary" });
  const home = nav.getByRole("button", { name: "Home" });
  await expect(home).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("img", { name: "Ada Lovelace" })).toHaveText("AL");
  const wide = (await nav.boundingBox())!.width;

  await nav.getByRole("button", { name: "Collapse the navigation" }).click();
  await expect(nav).toHaveAttribute("data-collapsed", "");
  const narrow = (await nav.boundingBox())!.width;
  expect(narrow).toBeLessThan(wide);
  // The name leaves the screen, not the accessibility tree.
  await expect(home).toHaveAccessibleName("Home");
  const label = home.locator(".sidebar__label--hidden");
  const box = await label.boundingBox();
  expect(box === null || (box.width <= 1 && box.height <= 1)).toBe(true);
});
