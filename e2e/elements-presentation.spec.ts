import { expect, test } from "@playwright/test";
import { VUE_BASE } from "../playwright.config";

test("Elements Card, Tag and Separator preserve native semantics and keyboard actions", async ({
  page,
}) => {
  await page.goto(VUE_BASE.replace("harness.html", "elements-harness.html"));
  await page.evaluate(async () => {
    await Promise.all([
      customElements.whenDefined("ds-card"),
      customElements.whenDefined("ds-tag"),
      customElements.whenDefined("ds-separator"),
    ]);
    document.body.innerHTML = `
      <ds-card title="Database" description="AdventureWorks" orientation="horizontal">
        <ds-tag slot="tags" status="success" removable remove-label="Remove status">Connected</ds-tag>
        <p>12 tables available.</p>
        <ds-button slot="actions">Open</ds-button>
      </ds-card>
      <ds-separator></ds-separator>`;
    document.querySelector("ds-tag")?.addEventListener("remove", (event) => {
      (event.currentTarget as HTMLElement).dataset.removeRequested = "true";
    });
  });

  const card = page.getByRole("article", { name: "Database" });
  await expect(card).toBeVisible();
  await expect(card).toContainText("AdventureWorks");
  await expect(card).toContainText("12 tables available.");
  await expect(page.getByRole("separator")).toHaveAttribute("aria-orientation", "horizontal");

  const remove = card.getByRole("button", { name: "Remove status" });
  await remove.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("ds-tag")).toHaveAttribute("data-remove-requested", "true");
  await expect(page.locator("ds-tag")).toBeVisible();
});
