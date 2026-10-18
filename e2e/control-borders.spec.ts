import { expect, test, type Locator, type Page } from "@playwright/test";

// Toggle Button, Toggle Group and Segmented Control draw their resting border
// with the default Button border, and a pressed toggle with the selected
// toggle border. Measured on the docs demos, in both themes.

/** The colour a token resolves to where `scope` sits. */
function tokenColor(scope: Locator, token: string) {
  return scope.evaluate((node, name) => {
    const probe = document.createElement("span");
    probe.style.borderTop = `1px solid var(${name})`;
    node.append(probe);
    const color = getComputedStyle(probe).borderTopColor;
    probe.remove();
    return color;
  }, token);
}

const borderTop = (node: Locator) =>
  node.evaluate((element) => getComputedStyle(element).borderTopColor);

async function open(page: Page, path: string, theme: "light" | "dark") {
  await page.addInitScript((value) => {
    document.addEventListener("DOMContentLoaded", () =>
      document.documentElement.setAttribute("data-theme", value),
    );
  }, theme);
  await page.goto(path);
}

for (const theme of ["light", "dark"] as const) {
  test(`toggle button borders follow the Button border and the selection (${theme})`, async ({
    page,
  }) => {
    await open(page, "components/forms/toggle-button/", theme);
    const bold = page.getByRole("button", { name: "Bold" });
    const favorite = page.getByRole("button", { name: "Favorite" });
    await expect(bold).toHaveAttribute("aria-pressed", "true");
    await expect(favorite).toHaveAttribute("aria-pressed", "false");
    const resting = await tokenColor(favorite, "--ds-components-button-border-default");
    const selected = await tokenColor(bold, "--ds-components-toggle-button-border-selected");
    expect(resting).not.toBe(selected);
    await expect.poll(() => borderTop(favorite.locator(".toggle__surface"))).toBe(resting);
    await expect.poll(() => borderTop(bold.locator(".toggle__surface"))).toBe(selected);
  });

  test(`the segmented control border is the Button border (${theme})`, async ({ page }) => {
    await open(page, "components/forms/segmented-control/", theme);
    const bar = page.locator(".ds-preview .segmented").first();
    await expect(bar).toBeVisible();
    expect(await borderTop(bar)).toBe(
      await tokenColor(bar, "--ds-components-button-border-default"),
    );
  });
}
