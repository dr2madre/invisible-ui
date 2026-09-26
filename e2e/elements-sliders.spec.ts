import { expect, test, type Locator, type Page } from "@playwright/test";
import { VUE_BASE } from "../playwright.config";

// Real-browser contract for <ds-slider>, <ds-range-slider> and
// <ds-rating-group>: the keyboard, the drag and the rendered positions belong
// to the native inputs, and only a browser can say what they do.

const ELEMENTS_BASE = VUE_BASE.replace("harness.html", "elements-harness.html");
const TAGS = ["ds-slider", "ds-range-slider", "ds-rating-group"];

const mount = async (page: Page, markup: string) => {
  await page.goto(ELEMENTS_BASE);
  await page.evaluate(
    async ({ tags, markup }) => {
      await Promise.all(tags.map((tag) => customElements.whenDefined(tag)));
      document.body.innerHTML = markup;
      // Every `change` the hosts send, in order, as "tag:value".
      document.body.addEventListener("change", (event) => {
        if (!(event instanceof CustomEvent)) return;
        const host = event.target as HTMLElement;
        const value = (event.detail as { value: unknown }).value;
        document.body.dataset.changes = [
          document.body.dataset.changes,
          `${host.localName}:${String(value)}`,
        ]
          .filter(Boolean)
          .join(" ");
      });
    },
    { tags: TAGS, markup },
  );
};

const changes = (page: Page) =>
  page.evaluate(() => (document.body.dataset.changes ?? "").split(" ").filter(Boolean));

const formData = (page: Page, testId: string) =>
  page
    .getByTestId(testId)
    .evaluate((form) =>
      [...new FormData(form as HTMLFormElement)].map(([name, value]) => `${name}=${value}`),
    );

const valueOf = (thumb: Locator) => thumb.evaluate((el) => Number((el as HTMLInputElement).value));
const zIndexOf = (thumb: Locator) => thumb.evaluate((el) => Number(getComputedStyle(el).zIndex));

/** Where a native thumb of `size` pixels paints at `fraction` of its input. */
const thumbPoint = async (input: Locator, fraction: number, size: number) => {
  const box = (await input.boundingBox())!;
  return {
    x: box.x + size / 2 + fraction * (box.width - size),
    y: box.y + box.height / 2,
  };
};

const drag = async (page: Page, from: { x: number; y: number }, toX: number) => {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move((from.x + toX) / 2, from.y, { steps: 4 });
  await page.mouse.move(toX, from.y, { steps: 4 });
  await page.mouse.up();
};

test.describe("Elements slider", () => {
  test.beforeEach(async ({ page }) => {
    await mount(
      page,
      `<form data-testid="form">
        <ds-slider label="Volume" name="volume" value="40" step="10" show-value></ds-slider>
      </form>`,
    );
  });

  test("native arrow keys, Home and End move the value, report it and submit it", async ({
    page,
  }) => {
    const slider = page.getByRole("slider", { name: "Volume" });
    await slider.focus();
    await page.keyboard.press("ArrowRight");
    await expect(slider).toHaveValue("50");
    await page.keyboard.press("ArrowUp");
    await expect(slider).toHaveValue("60");
    await page.keyboard.press("End");
    await expect(slider).toHaveValue("100");
    await page.keyboard.press("Home");
    await expect(slider).toHaveValue("0");

    expect(await changes(page)).toEqual([
      "ds-slider:50",
      "ds-slider:60",
      "ds-slider:100",
      "ds-slider:0",
    ]);
    await expect(page.locator("ds-slider")).toHaveAttribute("value", "0");
    await expect(page.locator(".slider-field__value")).toHaveText("0");
    expect(await formData(page, "form")).toEqual(["volume=0"]);

    // The reset puts the value, the readout and the fill back, silently.
    await page.getByTestId("form").evaluate((form) => (form as HTMLFormElement).reset());
    await expect(slider).toHaveValue("40");
    await expect(page.locator(".slider-field__value")).toHaveText("40");
    await expect(page.locator(".slider")).toHaveAttribute("style", /--_slider-pct: 40%/);
    expect(await changes(page)).toHaveLength(4);
  });

  test("a pointer drag moves the thumb and reports the value", async ({ page }) => {
    const slider = page.getByRole("slider", { name: "Volume" });
    const box = (await slider.boundingBox())!;
    await drag(page, await thumbPoint(slider, 0.4, 16), box.x + box.width * 0.8);

    const value = await valueOf(slider);
    expect(value).toBeGreaterThanOrEqual(70);
    expect(value).toBeLessThanOrEqual(90);
    await expect(page.locator("ds-slider")).toHaveAttribute("value", String(value));
    expect((await changes(page)).at(-1)).toBe(`ds-slider:${value}`);
    expect(await formData(page, "form")).toEqual([`volume=${value}`]);
  });
});

test.describe("Elements range slider", () => {
  test.beforeEach(async ({ page }) => {
    await mount(
      page,
      `<form data-testid="form">
        <ds-range-slider label="Price" lower-label="Minimum price" upper-label="Maximum price"
          name="price" value="20,80" min-distance="10"></ds-range-slider>
      </form>`,
    );
  });

  const lower = (page: Page) => page.getByRole("slider", { name: "Minimum price" });
  const upper = (page: Page) => page.getByRole("slider", { name: "Maximum price" });

  test("End and Home stop at the sibling plus the distance, and the pair is submitted", async ({
    page,
  }) => {
    await lower(page).focus();
    await page.keyboard.press("ArrowRight");
    await expect(lower(page)).toHaveValue("21");
    await page.keyboard.press("End");
    await expect(lower(page)).toHaveValue("70");
    await expect(upper(page)).toHaveValue("80");

    await upper(page).focus();
    await page.keyboard.press("Home");
    await expect(upper(page)).toHaveValue("80");
    await page.keyboard.press("End");
    await expect(upper(page)).toHaveValue("100");

    expect(await changes(page)).toEqual([
      "ds-range-slider:21,80",
      "ds-range-slider:70,80",
      "ds-range-slider:70,100",
    ]);
    await expect(lower(page)).toHaveAttribute("aria-valuemax", "90");
    await expect(lower(page)).toHaveAttribute("aria-valuetext", "70, minimum; may not exceed 90");
    expect(await formData(page, "form")).toEqual(["price=70", "price=100"]);

    await page.getByTestId("form").evaluate((form) => (form as HTMLFormElement).reset());
    await expect(lower(page)).toHaveValue("20");
    await expect(upper(page)).toHaveValue("80");
    await expect(page.locator(".range-slider")).toHaveAttribute(
      "style",
      /--_range-lower-pct: 20%; --_range-upper-pct: 80%/,
    );
  });

  test("a pointer drag moves the thumb it grabs and never crosses the other", async ({ page }) => {
    const box = (await lower(page).boundingBox())!;
    const start = await thumbPoint(upper(page), 0.8, 24);
    // Hovering first raises the thumb nearer the pointer, as a real press does.
    await page.mouse.move(start.x, start.y);
    await expect.poll(() => zIndexOf(upper(page))).toBeGreaterThan(await zIndexOf(lower(page)));
    await drag(page, start, box.x + box.width * 0.05);

    // Dragged far past the lower thumb, the upper one stops at 20 + 10.
    await expect(upper(page)).toHaveValue("30");
    await expect(lower(page)).toHaveValue("20");
    expect((await changes(page)).at(-1)).toBe("ds-range-slider:20,30");
  });
});

test.describe("Elements rating group", () => {
  test.beforeEach(async ({ page }) => {
    await mount(
      page,
      `<form data-testid="form">
        <ds-rating-group label="Rating" name="rating" value="2"></ds-rating-group>
      </form>`,
    );
  });

  test("native arrow keys move the rating, report it and submit it", async ({ page }) => {
    const two = page.getByRole("radio", { name: "2 stars" });
    const three = page.getByRole("radio", { name: "3 stars" });
    const four = page.getByRole("radio", { name: "4 stars" });
    await expect(two).toBeChecked();

    await two.focus();
    await page.keyboard.press("ArrowRight");
    await expect(three).toBeChecked();
    await expect(three).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expect(four).toBeChecked();

    expect(await changes(page)).toEqual(["ds-rating-group:3", "ds-rating-group:4"]);
    await expect(page.locator(".rating__star--filled")).toHaveCount(4);
    expect(await formData(page, "form")).toEqual(["rating=4"]);

    await page.getByTestId("form").evaluate((form) => (form as HTMLFormElement).reset());
    await expect(two).toBeChecked();
    await expect(page.locator(".rating__star--filled")).toHaveCount(2);
  });

  test("hovering previews the stars and a press sets the rating", async ({ page }) => {
    const stars = page.locator(".rating__star");
    await stars.nth(3).hover();
    await expect(page.locator(".rating__star--preview")).toHaveCount(4);
    await stars.nth(3).click();
    await expect(page.getByRole("radio", { name: "4 stars" })).toBeChecked();
    await page.mouse.move(0, 0);
    await expect(page.locator(".rating__star--preview")).toHaveCount(0);
    await expect(page.locator(".rating__star--filled")).toHaveCount(4);
    expect(await changes(page)).toEqual(["ds-rating-group:4"]);
  });
});

test.describe("Elements sliders and rating right to left", () => {
  test.beforeEach(async ({ page }) => {
    await mount(
      page,
      `<div dir="rtl">
        <ds-slider label="Volume" value="50"></ds-slider>
        <ds-range-slider label="Budget" lower-label="Minimum budget"
          upper-label="Maximum budget" value="20,80"></ds-range-slider>
        <ds-rating-group label="Rating"></ds-rating-group>
      </div>`,
    );
  });

  test("the slider's minimum sits on the right", async ({ page }) => {
    const slider = page.getByRole("slider", { name: "Volume" });
    const box = (await slider.boundingBox())!;
    await drag(page, await thumbPoint(slider, 0.5, 16), box.x + box.width * 0.02);
    expect(await valueOf(slider)).toBe(100);
    await drag(page, await thumbPoint(slider, 0, 16), box.x + box.width * 0.98);
    expect(await valueOf(slider)).toBe(0);
  });

  test("the range slider raises the thumb nearer the pointer along the logical axis", async ({
    page,
  }) => {
    const low = page.getByRole("slider", { name: "Minimum budget" });
    const high = page.getByRole("slider", { name: "Maximum budget" });
    const box = (await page.locator(".range-slider__track").boundingBox())!;
    const y = box.y + box.height / 2;
    await page.mouse.move(box.x + box.width * 0.1, y);
    expect(await zIndexOf(high), "left is the max end under rtl").toBeGreaterThan(
      await zIndexOf(low),
    );
    await page.mouse.move(box.x + box.width * 0.9, y);
    expect(await zIndexOf(low), "right is the min end under rtl").toBeGreaterThan(
      await zIndexOf(high),
    );
  });

  test("the first star stands on the right", async ({ page }) => {
    const first = (await page.getByRole("radio", { name: "1 star" }).locator("..").boundingBox())!;
    const last = (await page.getByRole("radio", { name: "5 stars" }).locator("..").boundingBox())!;
    expect(first.x).toBeGreaterThan(last.x);
  });
});

test.describe("Elements sliders and rating at 320 CSS pixels", () => {
  test.use({ viewport: { width: 320, height: 640 } });

  test("every control fits the width", async ({ page }) => {
    await mount(
      page,
      `<main>
        <ds-slider label="Volume" value="40" show-value show-range ticks step="10"></ds-slider>
        <ds-range-slider label="Price" lower-label="Minimum price" upper-label="Maximum price"
          value="20,80" show-value show-range></ds-range-slider>
        <ds-rating-group label="Rating" max="10"></ds-rating-group>
      </main>`,
    );
    await expect(page.getByRole("slider", { name: "Volume" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      320,
    );
    for (const selector of [".slider-field", ".range-slider-field", ".rating"]) {
      const box = (await page.locator(selector).boundingBox())!;
      expect(box.x, selector).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width, selector).toBeLessThanOrEqual(320);
    }
  });
});
