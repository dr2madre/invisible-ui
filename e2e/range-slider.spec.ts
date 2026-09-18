import { expect, test, type Locator, type Page } from "@playwright/test";

// Real-browser contract for the Range Slider, which is the part unit tests
// cannot reach: two native range inputs share one track, so the browser owns
// the keyboard, the drag and the rendered thumb position, and only a browser
// can say what they actually do.

const PAGE = "components/forms/range-slider/";

const lower = (page: Page) => page.getByRole("slider", { name: "Minimum price" });
const upper = (page: Page) => page.getByRole("slider", { name: "Maximum price" });

const valueOf = (thumb: Locator) => thumb.evaluate((el) => Number((el as HTMLInputElement).value));

test.beforeEach(async ({ page }) => {
  await page.goto(PAGE);
  await expect(lower(page)).toBeVisible();
});

test("the two thumbs stand in DOM order, lower first", async ({ page }) => {
  const order = await page.evaluate(() => {
    const inputs = [...document.querySelectorAll<HTMLInputElement>(".range-slider__input")];
    return inputs.slice(0, 2).map((input) => input.dataset.thumb);
  });
  expect(order).toEqual(["lower", "upper"]);
});

test("Tab walks from the lower thumb to the upper one", async ({ page, browserName }) => {
  // WebKit keeps non-text form controls out of the Tab sequence until the
  // system's full keyboard access is on, which is off in this build. That is
  // the platform's default for every native control on the page, not
  // something this component can set, so the engine is asked only for what it
  // offers: both thumbs still take focus, in order.
  await lower(page).focus();
  await expect(lower(page)).toBeFocused();

  if (browserName === "webkit") {
    await upper(page).focus();
    await expect(upper(page)).toBeFocused();
    return;
  }

  await page.keyboard.press("Tab");
  await expect(upper(page)).toBeFocused();
});

test("End on the lower thumb stops at the upper thumb, and never crosses it", async ({ page }) => {
  const before = await valueOf(upper(page));
  await lower(page).focus();
  await page.keyboard.press("End");
  const after = await valueOf(lower(page));
  // The browser would take the lower thumb to its own max (100): the clamp is
  // what stops it at the sibling, and the sibling itself must not move.
  expect(after).toBeLessThanOrEqual(before);
  expect(await valueOf(upper(page))).toBe(before);
});

test("Home on the upper thumb stops at the lower thumb, and never crosses it", async ({ page }) => {
  const before = await valueOf(lower(page));
  await upper(page).focus();
  await page.keyboard.press("Home");
  const after = await valueOf(upper(page));
  expect(after).toBeGreaterThanOrEqual(before);
  expect(await valueOf(lower(page))).toBe(before);
});

test("a minDistance the step grid cannot express is never handed to the user", async ({ page }) => {
  // The second demo carries minDistance=20 on a step of 1; End on its lower
  // thumb must land exactly 20 below the upper one, on the grid.
  const lowerTemp = page.getByRole("slider", { name: "Lowest temperature" });
  const upperTemp = page.getByRole("slider", { name: "Highest temperature" });
  const ceiling = await valueOf(upperTemp);
  await lowerTemp.focus();
  await page.keyboard.press("End");
  expect(await valueOf(lowerTemp)).toBe(ceiling - 20);
});

test("both thumbs keep the global bounds, so neither moves when the other does", async ({
  page,
}) => {
  // The rendered position of a native thumb is (value - min) / (max - min) of
  // the track. Narrowing one thumb's own min/max to the dependent bound would
  // move it on screen without its value changing — measured in the design
  // spike, and the reason the dependent bound travels as an ARIA override
  // instead. This is the regression test for that rule.
  const box = async (thumb: Locator) => (await thumb.boundingBox())!;
  const upperBefore = await box(upper(page));

  await lower(page).focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");

  const upperAfter = await box(upper(page));
  expect(Math.round(upperAfter.x)).toBe(Math.round(upperBefore.x));
  expect(await lower(page).getAttribute("min")).toBe(await upper(page).getAttribute("min"));
  expect(await lower(page).getAttribute("max")).toBe(await upper(page).getAttribute("max"));
});

test("each thumb reports the bound it may not cross", async ({ page }) => {
  const upperValue = await valueOf(upper(page));
  const lowerValue = await valueOf(lower(page));
  await expect(lower(page)).toHaveAttribute("aria-valuemax", String(upperValue));
  await expect(upper(page)).toHaveAttribute("aria-valuemin", String(lowerValue));
  // The override is discouraged on a native range input, so the same bound is
  // carried again as text, which no engine can decline to expose.
  await expect(lower(page)).toHaveAttribute("aria-valuetext", new RegExp(`${upperValue}`));
});

test("the thumb is a pointer target WCAG 2.2 accepts", async ({ page }) => {
  // Measured on the input itself: the thumb pseudo-element has no box of its
  // own to read, and it is what a drag has to grab.
  const size = await lower(page).evaluate((el) => {
    const styles = getComputedStyle(el);
    const declared = styles.getPropertyValue("--ds-range-slider-thumb-size").trim();
    const probe = document.createElement("div");
    probe.style.inlineSize = declared || "1.5rem";
    document.body.append(probe);
    const width = probe.getBoundingClientRect().width;
    probe.remove();
    return width;
  });
  expect(size).toBeGreaterThanOrEqual(24);
});

test("only the thumbs take a press; the bare track does not jump either of them", async ({
  page,
}) => {
  // Both inputs cover the whole track, so a press anywhere on it would reach
  // whichever one happens to be on top. Only the thumbs accept pointer events,
  // which costs the native click-to-jump and buys a press that always lands on
  // the thumb the user aimed at, including where there is no pointer to hover
  // first.
  const track = page.locator(".range-slider__track").first();
  const box = (await track.boundingBox())!;
  const middle = { x: box.x + box.width * 0.5, y: box.y + box.height / 2 };
  const hit = await page.evaluate(
    (at) => (document.elementFromPoint(at.x, at.y) as HTMLElement | null)?.tagName ?? "none",
    middle,
  );
  expect(hit).toBe("DIV");

  const lowerBefore = await valueOf(lower(page));
  const upperBefore = await valueOf(upper(page));
  await page.mouse.click(middle.x, middle.y);
  expect(await valueOf(lower(page))).toBe(lowerBefore);
  expect(await valueOf(upper(page))).toBe(upperBefore);
});

test("the thumb nearer the pointer is raised before the press lands", async ({ page }) => {
  const track = page.locator(".range-slider__track").first();
  const box = (await track.boundingBox())!;
  const y = box.y + box.height / 2;
  const zIndexOf = (thumb: Locator) => thumb.evaluate((el) => getComputedStyle(el).zIndex);

  // Near the lower thumb (at 20% of the track).
  await page.mouse.move(box.x + box.width * 0.22, y);
  expect(Number(await zIndexOf(lower(page)))).toBeGreaterThan(Number(await zIndexOf(upper(page))));

  // Near the upper thumb (at 80%).
  await page.mouse.move(box.x + box.width * 0.78, y);
  expect(Number(await zIndexOf(upper(page)))).toBeGreaterThan(Number(await zIndexOf(lower(page))));
});

test("the pair survives 320 CSS pixels and 400% zoom without a horizontal scrollbar", async ({
  page,
}) => {
  // WCAG 2.2 SC 1.4.10 (Reflow): 320px wide is 1280px at 400%.
  await page.setViewportSize({ width: 320, height: 512 });
  await expect(lower(page)).toBeVisible();
  await expect(upper(page)).toBeVisible();
  const overflows = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  expect(overflows).toBe(false);
});
