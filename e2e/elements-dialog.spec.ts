import { expect, test } from "@playwright/test";
import { VUE_BASE } from "../playwright.config";

const ELEMENTS_BASE = VUE_BASE.replace("harness.html", "elements-harness.html");

test.beforeEach(async ({ page }) => {
  await page.goto(ELEMENTS_BASE);
  await page.evaluate(async () => {
    await Promise.all([
      customElements.whenDefined("ds-dialog"),
      customElements.whenDefined("ds-text-field"),
    ]);
    const fixture = document.createElement("div");
    fixture.innerHTML = `
      <ds-dialog
        data-testid="stacking-dialog"
        heading="Example dialog"
        trigger="Open stacking dialog"
      >
        <p>Dialog content</p>
        <label>Dialog field <input type="text" /></label>
      </ds-dialog>
      <form data-testid="dialog-background">
        <ds-text-field label="Server" value="sql-demo.local"></ds-text-field>
        <ds-text-field label="Database" value="AdventureWorks"></ds-text-field>
      </form>
    `;
    document.body.append(fixture);
  });
  await expect(page.getByRole("button", { name: "Open stacking dialog" })).toBeVisible();
});

test("an Elements dialog is absent while closed and covers later controls while modal", async ({
  page,
}) => {
  const host = page.getByTestId("stacking-dialog");
  const panel = host.locator("dialog");
  const trigger = page.getByRole("button", { name: "Open stacking dialog" });
  const background = page.getByTestId("dialog-background");
  const outsideInput = background.locator("input").first();

  await expect(panel).not.toHaveAttribute("open", "");
  await expect(panel).toBeHidden();
  expect(await panel.boundingBox(), "a closed dialog must have no rendered box").toBeNull();
  await expect(outsideInput).toHaveAccessibleName("Server");

  // Put a real form control directly under the panel and give it the largest
  // ordinary stacking value. The native top layer still has to win.
  await background.evaluate((node) => {
    Object.assign((node as HTMLElement).style, {
      position: "fixed",
      inset: "50% auto auto 50%",
      transform: "translate(-50%, -50%)",
      zIndex: "2147483647",
    });
  });
  await outsideInput.evaluate((node) => {
    (window as typeof window & { outsideClicks: number }).outsideClicks = 0;
    node.addEventListener("click", () => {
      (window as typeof window & { outsideClicks: number }).outsideClicks += 1;
    });
  });

  await trigger.click();
  await expect(panel).toBeVisible();
  await expect(panel).toHaveAttribute("open", "");
  expect(await panel.evaluate((node) => node.matches(":modal"))).toBe(true);
  expect(await panel.evaluate((node) => getComputedStyle(node).display)).toBe("grid");

  const inputBox = await outsideInput.boundingBox();
  expect(inputBox).not.toBeNull();
  const point = {
    x: inputBox!.x + inputBox!.width / 2,
    y: inputBox!.y + inputBox!.height / 2,
  };
  expect(
    await panel.evaluate((dialog, { x, y }) => {
      const painted = document.elementFromPoint(x, y);
      return painted === dialog || (painted !== null && dialog.contains(painted));
    }, point),
    "the modal top layer must paint above an external control",
  ).toBe(true);

  await page.mouse.click(point.x, point.y);
  expect(
    await page.evaluate(() => (window as typeof window & { outsideClicks: number }).outsideClicks),
    "the inert background control received a pointer activation",
  ).toBe(0);
  await expect(panel).toBeVisible();

  await page.keyboard.press("Tab");
  expect(
    await panel.evaluate(
      (dialog) => dialog === document.activeElement || dialog.contains(document.activeElement),
    ),
    "keyboard focus escaped the modal dialog",
  ).toBe(true);

  await page.keyboard.press("Escape");
  await expect(panel).toBeHidden();
  expect(await panel.boundingBox(), "a closed dialog regained a rendered box").toBeNull();
  await expect(trigger).toBeFocused();
});

test("an Elements dialog used as a drawer dismisses only from its backdrop", async ({ page }) => {
  const host = page.getByTestId("stacking-dialog");
  const panel = host.locator("dialog");
  const trigger = page.getByRole("button", { name: "Open stacking dialog" });

  await panel.evaluate((node) => {
    Object.assign(node.style, {
      inset: "0 0 0 auto",
      margin: "0",
      inlineSize: "22rem",
      maxInlineSize: "calc(100vw - 2rem)",
      blockSize: "100vh",
      maxBlockSize: "100vh",
      borderRadius: "0",
    });
  });

  await trigger.click();
  await expect(panel).toBeVisible();

  const body = panel.locator(".dialog__body");
  const bodyBox = await body.boundingBox();
  const panelBox = await panel.boundingBox();
  expect(bodyBox).not.toBeNull();
  expect(panelBox).not.toBeNull();

  // Content, blank body space and the panel's own padding are all inside the
  // drawer. None is a light-dismiss request.
  await body.getByText("Dialog content").click();
  await expect(panel).toBeVisible();
  await page.mouse.click(bodyBox!.x + bodyBox!.width / 2, bodyBox!.y + bodyBox!.height - 4);
  await expect(panel).toBeVisible();
  await page.mouse.click(panelBox!.x + panelBox!.width - 4, panelBox!.y + panelBox!.height - 4);
  await expect(panel).toBeVisible();

  // The page-side area is the native backdrop and still dismisses exactly
  // once, leaving the trigger as the focus return target.
  await page.mouse.click(Math.max(1, panelBox!.x / 2), panelBox!.y + panelBox!.height / 2);
  await expect(panel).toBeHidden();
  await expect(trigger).toBeFocused();
});
