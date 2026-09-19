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

// --- Pointer geometry along the logical axis ---------------------------------
//
// The routing rule is core's; what the browser decides is which physical end
// of a native range is `min` under a writing direction. Measured in a probe
// before this was written, identical in Chromium, Firefox and WebKit: under
// `direction: rtl` a native range paints min on the right; under the vertical
// writing this library uses (`vertical-lr` + `rtl`) it paints min at the
// bottom. These tests hold the adapter to that.

const trackOf = (thumb: Locator) =>
  thumb.locator("xpath=ancestor::*[contains(@class, 'range-slider__track')][1]");
const zIndexOf = (thumb: Locator) => thumb.evaluate((el) => Number(getComputedStyle(el).zIndex));
const onTop = async (a: Locator, b: Locator) => (await zIndexOf(a)) > (await zIndexOf(b));

/**
 * The demos hydrate on visibility, and a pointer cannot reach what is below
 * the fold: bring the slider into view, then wait for the mark hydration
 * leaves, the stacking order the resting rule writes on mount (before it the
 * computed z-index is "auto", which is not a number).
 */
const ready = async (thumb: Locator) => {
  // The whole track, not only the thumb: a vertical track is taller than a
  // thumb, and a pointer cannot be moved to a point outside the viewport.
  await trackOf(thumb).scrollIntoViewIfNeeded();
  await expect.poll(() => zIndexOf(thumb)).not.toBeNaN();
};

test("vertical: a pointer near the top raises the upper thumb, near the bottom the lower", async ({
  page,
}) => {
  const low = page.getByRole("slider", { name: "Minimum volume" });
  const high = page.getByRole("slider", { name: "Maximum volume" });
  await ready(low);
  await expect(low).toHaveAttribute("aria-orientation", "vertical");
  const box = (await trackOf(low).boundingBox())!;
  expect(box.height).toBeGreaterThan(box.width);
  const x = box.x + box.width / 2;

  // The thumbs are painted where the values say, from the bottom up: 30 and
  // 70 of 100. Found by the browser's own hit test, scanning a thumb's width
  // around the estimate, since engines place a thumb's centre a little
  // differently near the ends. A vertical input sized with logical
  // properties would put both thumbs somewhere else entirely.
  const thumbAt = (fraction: number) =>
    page.evaluate(
      ([px, top, height, f]) => {
        const estimate = top + height - 12 - f * (height - 24);
        for (let dy = 0; dy <= 24; dy += 2) {
          for (const y of [estimate - dy, estimate + dy]) {
            const hit = document.elementFromPoint(px, y) as HTMLElement | null;
            if (hit?.tagName === "INPUT") return hit.dataset.thumb ?? null;
          }
        }
        return null;
      },
      [x, box.y, box.height, fraction] as const,
    );
  expect(await thumbAt(0.3), "the lower thumb sits 30% up the track").toBe("lower");
  expect(await thumbAt(0.7), "the upper thumb sits 70% up the track").toBe("upper");

  await page.mouse.move(x, box.y + box.height * 0.1);
  expect(await onTop(high, low), "top of the track is the max end").toBe(true);
  await page.mouse.move(x, box.y + box.height * 0.9);
  expect(await onTop(low, high), "bottom of the track is the min end").toBe(true);
});

test("rtl: a pointer at the physical left raises the upper thumb, since min is on the right", async ({
  page,
}) => {
  const low = page.getByRole("slider", { name: "Minimum budget" });
  const high = page.getByRole("slider", { name: "Maximum budget" });
  await ready(low);
  expect(await low.evaluate((el) => getComputedStyle(el).direction)).toBe("rtl");
  const box = (await trackOf(low).boundingBox())!;
  const y = box.y + box.height / 2;

  await page.mouse.move(box.x + box.width * 0.1, y);
  expect(await onTop(high, low), "left is the max end under rtl").toBe(true);
  await page.mouse.move(box.x + box.width * 0.9, y);
  expect(await onTop(low, high), "right is the min end under rtl").toBe(true);
});

test("switching orientation after mount switches the routing with it", async ({ page }) => {
  const low = page.getByRole("slider", { name: "Minimum brightness" });
  const high = page.getByRole("slider", { name: "Maximum brightness" });
  await ready(low);
  await expect(low).toHaveAttribute("aria-orientation", "horizontal");
  let box = (await trackOf(low).boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.1, box.y + box.height / 2);
  expect(await onTop(low, high), "horizontal: left is min").toBe(true);

  await page.getByRole("button", { name: "Switch to vertical" }).click();
  await expect(low).toHaveAttribute("aria-orientation", "vertical");
  await ready(low);
  box = (await trackOf(low).boundingBox())!;
  expect(box.height).toBeGreaterThan(box.width);
  const x = box.x + box.width / 2;
  await page.mouse.move(x, box.y + box.height * 0.1);
  expect(await onTop(high, low), "vertical: top is max").toBe(true);
  await page.mouse.move(x, box.y + box.height * 0.9);
  expect(await onTop(low, high), "vertical: bottom is min").toBe(true);
});

// --- Stacked thumbs, with and without a hover --------------------------------

/**
 * Which thumb the browser's own hit test finds around a position on the
 * track, with no pointer involved. Engines place a native thumb's centre a
 * little differently near the ends, so the estimate is scanned a thumb's width
 * either way and the first input hit wins.
 */
const hitThumb = (page: Page, box: { x: number; width: number }, y: number, fraction: number) =>
  page.evaluate(
    ([left, width, py, f]) => {
      const estimate = left + 12 + f * (width - 24);
      for (let dx = 0; dx <= 24; dx += 2) {
        for (const x of [estimate - dx, estimate + dx]) {
          const hit = document.elementFromPoint(x, py) as HTMLElement | null;
          if (hit?.tagName === "INPUT") return hit.dataset.thumb ?? null;
        }
      }
      return null;
    },
    [box.x, box.width, y, fraction] as const,
  );

test("stacked thumbs are reachable with no hover before the press, by a fixed rule", async ({
  page,
}) => {
  // Keyboard only until the check: the pointer never enters the track, so
  // no hover rule runs and the resting rule is what decides the top thumb,
  // as for a touch.
  await ready(lower(page));
  await upper(page).focus();
  await page.keyboard.press("Home"); // clamps at the lower thumb: stacked at 20
  expect(await valueOf(upper(page))).toBe(await valueOf(lower(page)));
  const box = (await trackOf(lower(page)).boundingBox())!;
  const y = box.y + box.height / 2;
  expect(await hitThumb(page, box, y, 0.2), "stacked mid-track: the upper thumb is on top").toBe(
    "upper",
  );

  // Stack them at max: only the lower thumb can still move, so it is on top.
  await page.keyboard.press("End"); // upper -> 100
  await lower(page).focus();
  await page.keyboard.press("End"); // lower -> 100
  expect(await valueOf(lower(page))).toBe(100);
  expect(await valueOf(upper(page))).toBe(100);
  expect(await hitThumb(page, box, y, 1), "stacked at max: the lower thumb is on top").toBe(
    "lower",
  );
});

test("stacked thumbs: the side of the stack the pointer is on picks the thumb", async ({
  page,
}) => {
  await ready(lower(page));
  await upper(page).focus();
  await page.keyboard.press("Home"); // stacked at 20
  const box = (await trackOf(lower(page)).boundingBox())!;
  const y = box.y + box.height / 2;
  const centre = box.x + 12 + 0.2 * (box.width - 24);

  await page.mouse.move(centre - 8, y);
  expect(await onTop(lower(page), upper(page)), "left of the stack: about to drag down").toBe(true);
  await page.mouse.move(centre + 8, y);
  expect(await onTop(upper(page), lower(page)), "right of the stack: about to drag up").toBe(true);
});
