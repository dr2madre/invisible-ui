import { expect, test, type Locator, type Page } from "@playwright/test";
import { VUE_BASE } from "../playwright.config";

const ELEMENTS_BASE = VUE_BASE.replace("harness.html", "elements-harness.html");

const mount = async (page: Page, tags: string[], markup: string) => {
  await page.goto(ELEMENTS_BASE);
  await page.evaluate(
    async ({ tags, markup }) => {
      await Promise.all(tags.map((tag) => customElements.whenDefined(tag)));
      document.body.innerHTML = markup;
    },
    { tags, markup },
  );
};

const day = (page: Page, iso: string) => page.locator(`[data-date="${iso}"]`);

// What the form would submit, as "name=value" pairs in document order.
const formData = (page: Page) =>
  page
    .locator("form")
    .evaluate((form) =>
      [...new FormData(form as HTMLFormElement)].map(([name, value]) => `${name}=${value}`),
    );

// The popup sits below its field and inside the viewport.
const expectBelowInViewport = async (page: Page, anchor: Locator, floating: Locator) => {
  await expect(async () => {
    const a = (await anchor.boundingBox())!;
    const f = (await floating.boundingBox())!;
    const viewport = page.viewportSize()!;
    expect(f.y).toBeGreaterThanOrEqual(a.y + a.height);
    expect(f.x).toBeGreaterThanOrEqual(0);
    expect(f.x + f.width).toBeLessThanOrEqual(viewport.width);
  }).toPass();
};

test.describe("Elements calendar", () => {
  test.beforeEach(async ({ page }) => {
    await mount(
      page,
      ["ds-calendar"],
      `<main lang="en-GB">
        <ds-calendar value="2026-06-15" week-starts-on="1"></ds-calendar>
      </main>`,
    );
    await page.evaluate(() => {
      const calendar = document.querySelector<HTMLElement>("ds-calendar")!;
      calendar.addEventListener("change", (event) => {
        calendar.dataset.picked = (event as CustomEvent<{ value: string }>).detail.value;
      });
    });
  });

  test("moves through the grid with the keyboard and selects", async ({ page }) => {
    await day(page, "2026-06-15").focus();
    await page.keyboard.press("ArrowRight");
    await expect(day(page, "2026-06-16")).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(day(page, "2026-06-23")).toBeFocused();
    await page.keyboard.press("End");
    await expect(day(page, "2026-06-28")).toBeFocused();
    await page.keyboard.press("Home");
    await expect(day(page, "2026-06-22")).toBeFocused();
    await page.keyboard.press("PageDown");
    await expect(day(page, "2026-07-22")).toBeFocused();
    await expect(page.getByRole("heading", { name: "July 2026" })).toBeVisible();
    await page.keyboard.press("Shift+PageUp");
    await expect(day(page, "2025-07-22")).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("ds-calendar")).toHaveAttribute("data-picked", "2025-07-22");
    await expect(day(page, "2025-07-22")).toHaveAttribute("data-selected", "");
    await expect(day(page, "2025-07-22")).toBeFocused();
  });

  test("follows the visual direction in right-to-left text", async ({ page }) => {
    await page.locator("ds-calendar").evaluate((el) => el.setAttribute("dir", "rtl"));
    await day(page, "2026-06-15").focus();
    await page.keyboard.press("ArrowLeft");
    await expect(day(page, "2026-06-16")).toBeFocused();
    const next = (await day(page, "2026-06-16").boundingBox())!;
    const previous = (await day(page, "2026-06-15").boundingBox())!;
    expect(next.x).toBeLessThan(previous.x);
  });
});

test.describe("Elements date picker", () => {
  test.beforeEach(async ({ page }) => {
    await mount(
      page,
      ["ds-date-picker"],
      `<main lang="en-GB">
        <form>
          <ds-date-picker label="Due date" name="due" value="2026-06-15"></ds-date-picker>
        </form>
        <p>Outside the picker</p>
      </main>`,
    );
  });

  test("opens from the keyboard below the field, picks a day and returns focus", async ({
    page,
  }) => {
    const field = page.getByRole("combobox", { name: "Due date" });
    await field.focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog", { name: "Due date" });
    await expect(dialog).toBeVisible();
    await expect(field).toHaveAttribute("aria-expanded", "true");
    await expect(day(page, "2026-06-15")).toBeFocused();
    await expectBelowInViewport(page, field, dialog);

    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Enter");
    await expect(dialog).toBeHidden();
    await expect(field).toBeFocused();
    await expect(field).toHaveValue("16 Jun 2026");
    expect(await formData(page)).toEqual(["due=2026-06-16"]);
  });

  test("Escape closes and returns focus; an outside press closes in place", async ({ page }) => {
    const field = page.getByRole("combobox", { name: "Due date" });
    await field.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(field).toBeFocused();

    await field.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByText("Outside the picker").click();
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(field).toHaveValue("15 Jun 2026");
  });

  test("fits a 320px viewport", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    const field = page.getByRole("combobox", { name: "Due date" });
    await field.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expectBelowInViewport(page, field, dialog);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test.describe("Elements date range picker", () => {
  test.beforeEach(async ({ page }) => {
    await mount(
      page,
      ["ds-date-range-picker"],
      `<main lang="en-GB">
        <form>
          <ds-date-range-picker label="Stay" start-name="from" end-name="to"
            start="2026-06-10" end="2026-06-12"></ds-date-range-picker>
        </form>
      </main>`,
    );
  });

  test("makes a range across two picks and submits both ends", async ({ page }) => {
    const field = page.getByRole("combobox", { name: "Stay" });
    await field.click();
    await expect(page.getByRole("grid")).toHaveCount(2);
    await day(page, "2026-06-18").click();
    await expect(day(page, "2026-06-18")).toHaveAttribute("data-range-start", "");
    await day(page, "2026-07-02").click();
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(field).toBeFocused();
    expect(await formData(page)).toEqual(["from=2026-06-18", "to=2026-07-02"]);
  });

  test("fits a 320px viewport with both months", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    const field = page.getByRole("combobox", { name: "Stay" });
    await field.click();
    const dialog = page.getByRole("dialog");
    await expect(page.getByRole("grid")).toHaveCount(2);
    await expect(async () => {
      const box = (await dialog.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(320);
    }).toPass();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test.describe("Elements time field", () => {
  test.beforeEach(async ({ page }) => {
    await mount(
      page,
      ["ds-time-field"],
      `<main lang="en-GB">
        <form>
          <ds-time-field label="Start" name="start"></ds-time-field>
          <button type="button">After</button>
        </form>
      </main>`,
    );
    await page.evaluate(() => {
      const field = document.querySelector<HTMLElement>("ds-time-field")!;
      field.addEventListener("commit", (event) => {
        field.dataset.committed = String((event as CustomEvent<{ value: string }>).detail.value);
      });
    });
  });

  test("types a time segment by segment and reports it when focus leaves", async ({ page }) => {
    const hour = page.getByRole("spinbutton", { name: "Hour" });
    await hour.click();
    await page.keyboard.type("1430");
    await expect(hour).toHaveText("14");
    await expect(page.getByRole("spinbutton", { name: "Minute" })).toHaveText("30");
    await expect(page.getByRole("spinbutton", { name: "Minute" })).toBeFocused();
    await page.keyboard.press("ArrowUp");
    await expect(page.getByRole("spinbutton", { name: "Minute" })).toHaveText("31");
    expect(await formData(page)).toEqual(["start=14:31"]);

    await page.getByRole("button", { name: "After" }).click();
    await expect(page.locator("ds-time-field")).toHaveAttribute("data-committed", "14:31");
  });

  test("shows the day period for a 12-hour locale", async ({ page }) => {
    await page.locator("main").evaluate((el) => el.setAttribute("lang", "en-US"));
    await page.locator("ds-time-field").evaluate((el) => el.setAttribute("hour-cycle", "12"));
    const period = page.getByRole("spinbutton", { name: "AM/PM" });
    await page.getByRole("spinbutton", { name: "Hour" }).click();
    await page.keyboard.type("0930");
    await period.focus();
    await page.keyboard.press("p");
    await expect(period).toHaveText("PM");
    expect(await formData(page)).toEqual(["start=21:30"]);
  });
});
