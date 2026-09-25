import { expect, test } from "@playwright/test";
import { VUE_BASE } from "../playwright.config";

test("Elements icon button badge describes the button and sits on its corner", async ({ page }) => {
  await page.goto(VUE_BASE.replace("harness.html", "elements-harness.html"));
  await page.evaluate(async () => {
    await Promise.all([
      customElements.whenDefined("ds-button"),
      customElements.whenDefined("ds-count"),
    ]);
    document.body.innerHTML = `
      <ds-button icon-only variant="ghost" aria-label="Notifications">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" /></svg>
        <ds-count slot="badge" count="3" label="3 unread notifications"></ds-count>
      </ds-button>`;
  });

  const button = page.getByRole("button", { name: "Notifications" });
  await expect(button).toHaveAccessibleName("Notifications");
  await expect(button).toHaveAccessibleDescription("3 unread notifications");

  const buttonBox = (await button.boundingBox())!;
  const badgeBox = (await page.locator(".button__badge").boundingBox())!;
  // On the top trailing corner, overlapping the button's edge.
  expect(badgeBox.y).toBeLessThan(buttonBox.y);
  expect(badgeBox.x + badgeBox.width).toBeGreaterThan(buttonBox.x + buttonBox.width);
  expect(badgeBox.x).toBeLessThan(buttonBox.x + buttonBox.width);
});
