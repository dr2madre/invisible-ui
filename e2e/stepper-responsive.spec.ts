import { expect, test, type Locator, type Page } from "@playwright/test";

// The stepper keeps one horizontal row while its container is wide enough, and
// becomes the vertical presentation when it is not. Geometry, truncation and
// overflow are layout facts jsdom cannot see. These are automated geometry
// checks: they are not a manual 400% zoom pass and not a screen-reader pass.
const EXPANDED = '[data-testid="stepper-expanded"] .stepper';
const UNBROKEN = "Rindfleischetikettierungsüberwachungsaufgabenübertragungsgesetz";

const openStepper = async (page: Page) => {
  await page.goto("components/patterns/stepper/");
  const stepper = page.locator(EXPANDED).first();
  await expect(stepper).toBeVisible();
  return stepper;
};

const overflowsSideways = (target: Locator) =>
  target.evaluate((node) => node.scrollWidth > node.clientWidth + 1);

/** Boxes of the steps and of the connectors, in DOM order. */
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

test("keeps the expanded labels whole, including an unbroken token", async ({ page }) => {
  const stepper = await openStepper(page);
  const labels = await stepper.locator(".stepper__label").all();

  const texts = await Promise.all(labels.map((label) => label.textContent()));
  expect(texts.some((text) => text?.includes(UNBROKEN))).toBe(true);

  for (const label of labels) {
    const state = await label.evaluate((node) => ({
      clipped: node.scrollWidth > node.clientWidth + 1,
      ellipsis: getComputedStyle(node).textOverflow === "ellipsis",
      nowrap: getComputedStyle(node).whiteSpace === "nowrap",
      wrap: getComputedStyle(node).overflowWrap,
      lines: node.getClientRects().length,
    }));
    expect(state.clipped, `"${await label.textContent()}" is cut off`).toBe(false);
    expect(state.ellipsis).toBe(false);
    expect(state.nowrap).toBe(false);
    expect(state.wrap).toBe("anywhere");
    expect(state.lines).toBeGreaterThan(0);
  }
});

test("at 320 pixels it is one vertical sequence with vertical connectors", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  const stepper = await openStepper(page);
  const { steps, connectors } = await geometry(stepper);

  expect(steps).toHaveLength(3);
  expect(connectors).toHaveLength(2);

  // One column: every step starts below the previous one, none beside it.
  for (let i = 1; i < steps.length; i++) {
    expect(steps[i]!.y).toBeGreaterThanOrEqual(steps[i - 1]!.y + steps[i - 1]!.height - 1);
  }

  // Each connector is taller than it is wide, and sits between the two steps
  // it joins, so the sequence still reads as a sequence.
  for (const [index, connector] of connectors.entries()) {
    expect(connector.height, "connector is not vertical").toBeGreaterThan(connector.width);
    const before = steps[index]!;
    const after = steps[index + 1]!;
    expect(connector.y).toBeGreaterThanOrEqual(before.y - 1);
    expect(connector.y + connector.height).toBeLessThanOrEqual(after.y + after.height + 1);
  }

  expect(await overflowsSideways(stepper)).toBe(false);
  const pageOverflows = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  expect(pageOverflows).toBe(false);
});

test("in a wide container it stays one row with horizontal connectors", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const stepper = await openStepper(page);
  const { steps, connectors } = await geometry(stepper);

  // One row: every step shares the top edge of the first.
  for (const step of steps) expect(Math.abs(step.y - steps[0]!.y)).toBeLessThan(4);

  // Each connector is wider than it is tall and sits between its two steps.
  for (const [index, connector] of connectors.entries()) {
    expect(connector.width, "connector is not horizontal").toBeGreaterThan(connector.height);
    expect(connector.x).toBeGreaterThanOrEqual(steps[index]!.x - 1);
    expect(connector.x + connector.width).toBeLessThanOrEqual(
      steps[index + 1]!.x + steps[index + 1]!.width + 1,
    );
  }

  expect(await overflowsSideways(stepper)).toBe(false);
});

test("keeps every enabled control reachable and focus visible at 320 pixels", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  const stepper = await openStepper(page);
  const steps = await stepper.getByRole("button").all();
  expect(steps.length).toBeGreaterThan(0);

  for (const step of steps) {
    await step.focus();
    await expect(step).toBeFocused();
    const ring = await step.evaluate((node) => {
      const style = getComputedStyle(node);
      return style.boxShadow !== "none" || style.outlineStyle !== "none";
    });
    expect(ring).toBe(true);
  }

  // The current step is still marked, and still on screen.
  const current = stepper.locator('[aria-current="step"]');
  await expect(current).toHaveCount(1);
  await expect(current).toBeVisible();
});

test("right-to-left keeps the DOM order and adds no overflow", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  const stepper = await openStepper(page);
  await stepper.evaluate((node) => node.setAttribute("dir", "rtl"));

  expect(await overflowsSideways(stepper)).toBe(false);

  // DOM order is unchanged: the labels still read in sequence.
  const labels = await stepper.locator(".stepper__label").allTextContents();
  expect(labels[1]).toContain(UNBROKEN);

  // Vertical sequence, so the steps stack rather than mirror.
  const { steps } = await geometry(stepper);
  for (let i = 1; i < steps.length; i++) {
    expect(steps[i]!.y).toBeGreaterThan(steps[i - 1]!.y);
  }
});

test("the explicit vertical orientation is unaffected by the container width", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const stepper = await openStepper(page);
  await stepper.evaluate((node) => {
    node.querySelector(".stepper__list")!.setAttribute("data-orientation", "vertical");
  });

  const { steps, connectors } = await geometry(stepper);
  for (let i = 1; i < steps.length; i++) {
    expect(steps[i]!.y).toBeGreaterThan(steps[i - 1]!.y);
  }
  for (const connector of connectors) {
    expect(connector.height).toBeGreaterThan(connector.width);
  }
});
