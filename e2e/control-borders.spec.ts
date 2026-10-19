import { expect, test, type Locator, type Page } from "@playwright/test";

// Toggle Button, Toggle Group and Segmented Control draw their resting border
// with the default Button border, and a pressed toggle with the selected
// toggle border. At rest a toggle takes the default Button fill and label;
// pressed, it takes the shared selected fill and label, as does the selected
// segment. Measured on the docs demos, in both themes.

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
const fill = (node: Locator) =>
  node.evaluate((element) => getComputedStyle(element).backgroundColor);
const label = (node: Locator) => node.evaluate((element) => getComputedStyle(element).color);

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

  test(`toggle button fill and label follow the Button and the selection (${theme})`, async ({
    page,
  }) => {
    await open(page, "components/forms/toggle-button/", theme);
    const bold = page.getByRole("button", { name: "Bold" }).locator(".toggle__surface");
    const favorite = page.getByRole("button", { name: "Favorite" }).locator(".toggle__surface");
    await expect(bold).toBeVisible();
    const scope = page.locator(".ds-preview").first();
    await expect
      .poll(() => fill(favorite))
      .toBe(await tokenColor(scope, "--ds-components-button-background-default"));
    await expect
      .poll(() => label(favorite))
      .toBe(await tokenColor(scope, "--ds-components-button-foreground-default"));
    await expect
      .poll(() => fill(bold))
      .toBe(await tokenColor(scope, "--ds-components-general-background-selected"));
    await expect
      .poll(() => label(bold))
      .toBe(await tokenColor(scope, "--ds-components-general-foreground-selected"));
  });

  test(`the selected segment takes the selected fill and label (${theme})`, async ({ page }) => {
    await open(page, "components/forms/segmented-control/", theme);
    const segment = page
      .locator(".ds-preview .segment")
      .filter({ has: page.locator("input:checked") })
      .first();
    await expect(segment).toBeVisible();
    await expect
      .poll(() => fill(segment))
      .toBe(await tokenColor(segment, "--ds-components-general-background-selected"));
    await expect
      .poll(() => label(segment))
      .toBe(await tokenColor(segment, "--ds-components-general-foreground-selected"));
  });
}
