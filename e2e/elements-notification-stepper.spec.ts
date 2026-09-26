import { expect, test, type Locator, type Page } from "@playwright/test";
import { VUE_BASE } from "../playwright.config";

const HARNESS = VUE_BASE.replace("harness.html", "elements-harness.html");
const UNBROKEN = "Rindfleischetikettierungsüberwachungsaufgabenübertragungsgesetz";

const openRegion = async (page: Page) => {
  await page.goto(HARNESS);
  await page.evaluate(async () => {
    await customElements.whenDefined("ds-notification-region");
    document.body.innerHTML = `
      <main><h1>Notifications</h1><button type="button">Elsewhere</button></main>
      <ds-notification-region placement="bottom-center"></ds-notification-region>`;
  });
};

/** Show a notification through the element's API and return its id. */
const show = (page: Page, options: Record<string, unknown>) =>
  page.evaluate(
    (opts) =>
      (
        document.querySelector("ds-notification-region") as HTMLElement & {
          show(options: unknown): string;
        }
      ).show(opts),
    options,
  );

test.describe("Elements notification region", () => {
  test("announces a notification as a live region inside a labelled landmark", async ({ page }) => {
    await openRegion(page);
    await show(page, { title: "Changes saved", text: "Your profile is up to date." });

    const region = page.getByRole("region", { name: "Notifications" });
    await expect(region).toBeVisible();
    const status = region.getByRole("status", { name: "Changes saved" });
    await expect(status).toBeVisible();
    await expect(status).toContainText("Your profile is up to date.");
    // Announcing never moves focus.
    await expect(page.locator("body")).toBeFocused();

    await show(page, { title: "Upload failed", role: "alert" });
    await expect(region.getByRole("alert", { name: "Upload failed" })).toBeVisible();
  });

  test("holds the countdown while the pointer is over the stack", async ({ page }) => {
    await openRegion(page);
    await show(page, { title: "Hover me", duration: 1200 });
    const notice = page.getByRole("status", { name: "Hover me" });
    await expect(notice).toBeVisible();

    await notice.hover();
    await page.waitForTimeout(2000);
    await expect(notice).toBeVisible();

    await page.mouse.move(5, 5);
    await expect(notice).toBeHidden({ timeout: 4000 });
  });

  test("holds the countdown while a notification holds focus", async ({ page }) => {
    await openRegion(page);
    await show(page, { title: "Focus me", duration: 1200 });
    const notice = page.getByRole("status", { name: "Focus me" });
    await notice.getByRole("button", { name: "Close" }).focus();

    await page.waitForTimeout(2000);
    await expect(notice).toBeVisible();

    await page.getByRole("button", { name: "Elsewhere" }).focus();
    await expect(notice).toBeHidden({ timeout: 4000 });
  });

  test("dismisses from the keyboard and releases the pause", async ({ page }) => {
    await openRegion(page);
    await show(page, { title: "Stays briefly", duration: 1500 });
    await show(page, { title: "Close me" });
    const closing = page.getByRole("status", { name: "Close me" });
    const close = closing.getByRole("button", { name: "Close" });
    await close.focus();
    await expect(close).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(closing).toHaveCount(0);

    // The dismissed notification held focus; the other countdown runs again.
    await expect(page.getByRole("status", { name: "Stays briefly" })).toBeHidden({
      timeout: 4000,
    });

    await show(page, { title: "Space closes too" });
    const spaced = page.getByRole("status", { name: "Space closes too" });
    await spaced.getByRole("button", { name: "Close" }).focus();
    await page.keyboard.press("Space");
    await expect(spaced).toHaveCount(0);
  });

  test("an action runs, then dismisses", async ({ page }) => {
    await openRegion(page);
    await page.evaluate(() => {
      const region = document.querySelector("ds-notification-region") as HTMLElement & {
        show(options: unknown): string;
      };
      region.show({
        title: "Draft deleted",
        actions: [{ label: "Undo", onClick: () => (document.title = "undone") }],
      });
    });
    await page.getByRole("button", { name: "Undo" }).click();
    await expect(page.getByRole("status", { name: "Draft deleted" })).toHaveCount(0);
    await expect(page).toHaveTitle("undone");
  });
});

const openStepper = async (page: Page) => {
  await page.goto(HARNESS);
  await page.evaluate(async (unbroken) => {
    await customElements.whenDefined("ds-stepper");
    document.body.innerHTML = `<ds-stepper label="Setup progress" current="1"></ds-stepper>`;
    (
      document.querySelector("ds-stepper") as HTMLElement & {
        steps: { label: string; description?: string }[];
      }
    ).steps = [
      { label: "Create the workspace and invite the people who work on it" },
      { label: `Accept the ${unbroken}`, description: "Read the terms before you continue" },
      { label: "Review every setting and confirm the configuration" },
    ];
  }, UNBROKEN);
  const stepper = page.getByRole("navigation", { name: "Setup progress" });
  await expect(stepper).toBeVisible();
  return stepper;
};

const overflowsSideways = (target: Locator) =>
  target.evaluate((node) => node.scrollWidth > node.clientWidth + 1);

const geometry = async (stepper: Locator) => {
  const steps = [];
  for (const step of await stepper.locator(".stepper__step").all()) {
    steps.push((await step.boundingBox())!);
  }
  const connectors = [];
  for (const connector of await stepper.locator(".stepper__connector").all()) {
    connectors.push((await connector.boundingBox())!);
  }
  return { steps, connectors };
};

test.describe("Elements stepper reflow", () => {
  test("at 320 pixels the labels wrap whole in one vertical sequence", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    const stepper = await openStepper(page);

    const labels = await stepper.locator(".stepper__label").all();
    const texts = await Promise.all(labels.map((label) => label.textContent()));
    expect(texts[1]).toContain(UNBROKEN);
    for (const label of labels) {
      const state = await label.evaluate((node) => {
        const style = getComputedStyle(node);
        return {
          clipped: node.scrollWidth > node.clientWidth + 1,
          ellipsis: style.textOverflow === "ellipsis",
          lines: Math.round(node.getBoundingClientRect().height / parseFloat(style.lineHeight)),
        };
      });
      expect(state.clipped).toBe(false);
      expect(state.ellipsis).toBe(false);
      expect(state.lines, "the label should wrap onto more lines").toBeGreaterThan(1);
    }

    const { steps, connectors } = await geometry(stepper);
    expect(connectors).toHaveLength(2);
    for (let i = 1; i < steps.length; i++) {
      expect(steps[i]!.y).toBeGreaterThanOrEqual(steps[i - 1]!.y + steps[i - 1]!.height - 1);
    }
    for (const [index, connector] of connectors.entries()) {
      expect(connector.height, "connector is not vertical").toBeGreaterThan(connector.width);
      expect(connector.y).toBeGreaterThanOrEqual(steps[index]!.y - 1);
      expect(connector.y + connector.height).toBeLessThanOrEqual(
        steps[index + 1]!.y + steps[index + 1]!.height + 1,
      );
    }

    expect(await overflowsSideways(stepper)).toBe(false);
    const pageOverflows = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(pageOverflows).toBe(false);
  });

  test("keeps the current step and every enabled step reachable at 320 pixels", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    const stepper = await openStepper(page);
    const current = stepper.locator('[aria-current="step"]');
    await expect(current).toHaveCount(1);
    await expect(current).toBeVisible();

    // Focused directly: WebKit on macOS skips buttons on Tab by default.
    for (const step of await stepper.locator("button:enabled").all()) {
      await step.focus();
      await expect(step).toBeFocused();
      const ring = await step.evaluate((node) => {
        const style = getComputedStyle(node);
        return style.boxShadow !== "none" || style.outlineStyle !== "none";
      });
      expect(ring).toBe(true);
    }
    // The upcoming step is disabled in linear mode, so it takes no focus.
    await expect(stepper.getByRole("button").last()).toBeDisabled();
  });

  test("right-to-left keeps the DOM order and adds no overflow", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    const stepper = await openStepper(page);
    await stepper.evaluate((node) => node.setAttribute("dir", "rtl"));
    expect(await overflowsSideways(stepper)).toBe(false);
    const labels = await stepper.locator(".stepper__label").allTextContents();
    expect(labels[1]).toContain(UNBROKEN);
    const { steps } = await geometry(stepper);
    for (let i = 1; i < steps.length; i++) {
      expect(steps[i]!.y).toBeGreaterThan(steps[i - 1]!.y);
    }
  });

  test("in a wide container it stays one row with horizontal connectors", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const stepper = await openStepper(page);
    const { steps, connectors } = await geometry(stepper);
    for (const step of steps) expect(Math.abs(step.y - steps[0]!.y)).toBeLessThan(4);
    for (const [index, connector] of connectors.entries()) {
      expect(connector.width, "connector is not horizontal").toBeGreaterThan(connector.height);
      expect(connector.x).toBeGreaterThanOrEqual(steps[index]!.x - 1);
      expect(connector.x + connector.width).toBeLessThanOrEqual(
        steps[index + 1]!.x + steps[index + 1]!.width + 1,
      );
    }
    expect(await overflowsSideways(stepper)).toBe(false);
  });
});
