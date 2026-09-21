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
      <ds-card title="Database" description="AdventureWorks" orientation="horizontal"
        surface="secondary" style="--ds-card-secondary-bg: rgb(244, 242, 239)">
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
  await expect(card).toHaveAttribute("data-surface", "secondary");
  await expect(card).toHaveCSS("background-color", "rgb(244, 242, 239)");
  await expect(page.getByRole("separator")).toHaveAttribute("aria-orientation", "horizontal");

  const remove = card.getByRole("button", { name: "Remove status" });
  await remove.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("ds-tag")).toHaveAttribute("data-remove-requested", "true");
  await expect(page.locator("ds-tag")).toBeVisible();
});

test("Elements Empty State is announced and exposes a keyboard action", async ({ page }) => {
  await page.goto(VUE_BASE.replace("harness.html", "elements-harness.html"));
  await page.evaluate(async () => {
    await customElements.whenDefined("ds-empty-state");
    document.body.innerHTML = `
      <ds-empty-state title="No rules yet" description="Create the first rule."
        action-label="Add rule" size="sm"></ds-empty-state>`;
    document.querySelector("ds-empty-state")?.addEventListener("action", (event) => {
      (event.currentTarget as HTMLElement).dataset.actionRequested = "true";
    });
  });

  const status = page.getByRole("status");
  await expect(status).toBeVisible();
  await expect(status.getByRole("heading", { name: "No rules yet" })).toBeVisible();
  const action = status.getByRole("button", { name: "Add rule" });
  await action.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("ds-empty-state")).toHaveAttribute("data-action-requested", "true");
});

test("Elements Error State is announced and exposes a keyboard recovery action", async ({
  page,
}) => {
  await page.goto(VUE_BASE.replace("harness.html", "elements-harness.html"));
  await page.evaluate(async () => {
    await customElements.whenDefined("ds-error-state");
    document.body.innerHTML = `
      <ds-error-state title="Connection failed" description="Check the server and try again."
        action-label="Try again" size="sm"></ds-error-state>`;
    document.querySelector("ds-error-state")?.addEventListener("action", (event) => {
      (event.currentTarget as HTMLElement).dataset.actionRequested = "true";
    });
  });

  const alert = page.getByRole("alert");
  await expect(alert).toBeVisible();
  await expect(alert.getByRole("heading", { name: "Connection failed" })).toBeVisible();
  const action = alert.getByRole("button", { name: "Try again" });
  await action.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("ds-error-state")).toHaveAttribute("data-action-requested", "true");
});

test("Elements Inline Notification announces feedback and dismisses from the keyboard", async ({
  page,
}) => {
  await page.goto(VUE_BASE.replace("harness.html", "elements-harness.html"));
  await page.evaluate(async () => {
    await customElements.whenDefined("ds-inline-notification");
    document.body.innerHTML = `
      <ds-inline-notification title="Saved" description="Your changes were saved."
        status="success" closable close-label="Dismiss saved message"></ds-inline-notification>`;
    document.querySelector("ds-inline-notification")?.addEventListener("open-change", (event) => {
      const detail = (event as CustomEvent<{ open: boolean }>).detail;
      (event.currentTarget as HTMLElement).dataset.reportedOpen = String(detail.open);
    });
  });

  const notification = page.getByRole("status", { name: "Saved" });
  await expect(notification).toContainText("Your changes were saved.");
  const close = notification.getByRole("button", { name: "Dismiss saved message" });
  const box = await close.boundingBox();
  expect(box?.width).toBeGreaterThanOrEqual(24);
  expect(box?.height).toBeGreaterThanOrEqual(24);
  await close.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("ds-inline-notification")).toHaveAttribute(
    "data-reported-open",
    "false",
  );
  await expect(page.locator(".inline-notification")).toHaveCount(0);
});
