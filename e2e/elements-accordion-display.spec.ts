import { expect, test, type Page } from "@playwright/test";
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

const ACCORDION = (attributes = "") => `
  <main>
    <ds-accordion ${attributes}>
      <ds-accordion-item value="shipping" label="Shipping">Ships in 3 to 5 days.</ds-accordion-item>
      <ds-accordion-item value="returns" label="Returns">Returns within 30 days.</ds-accordion-item>
      <ds-accordion-item value="support" label="Support">Email support.</ds-accordion-item>
    </ds-accordion>
  </main>`;

test("Elements accordion moves between headers from the keyboard and opens one item", async ({
  page,
}) => {
  await mount(page, ["ds-accordion", "ds-accordion-item"], ACCORDION());

  const shipping = page.getByRole("button", { name: "Shipping" });
  const returns = page.getByRole("button", { name: "Returns" });
  const support = page.getByRole("button", { name: "Support" });
  await expect(page.getByRole("region")).toHaveCount(0);

  await shipping.focus();
  await page.keyboard.press("ArrowDown");
  await expect(returns).toBeFocused();
  await page.keyboard.press("End");
  await expect(support).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(shipping).toBeFocused();
  await page.keyboard.press("ArrowUp");
  await expect(support).toBeFocused();
  await page.keyboard.press("Home");
  await expect(shipping).toBeFocused();

  await page.keyboard.press("Enter");
  await expect(shipping).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("region", { name: "Shipping" })).toHaveText("Ships in 3 to 5 days.");

  // Single: opening another item closes the first.
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Space");
  await expect(returns).toHaveAttribute("aria-expanded", "true");
  await expect(shipping).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByRole("region")).toHaveCount(1);
  await expect(page.locator("ds-accordion")).toHaveAttribute("value", "returns");
});

test("Elements accordion keeps several items open when multiple", async ({ page }) => {
  await mount(page, ["ds-accordion", "ds-accordion-item"], ACCORDION(`type="multiple"`));

  await page.getByRole("button", { name: "Shipping" }).click();
  await page.getByRole("button", { name: "Support" }).click();
  await expect(page.getByRole("region")).toHaveCount(2);
  await expect(page.getByRole("region", { name: "Support" })).toBeVisible();

  await page.getByRole("button", { name: "Shipping" }).click();
  await expect(page.getByRole("region")).toHaveCount(1);
});

test("Elements collapsible toggles its content from the pointer and the keyboard", async ({
  page,
}) => {
  await mount(
    page,
    ["ds-collapsible"],
    `<main>
      <ds-collapsible label="Build details"><p>Built in 42 seconds.</p></ds-collapsible>
    </main>`,
  );

  const trigger = page.getByRole("button", { name: "Build details" });
  const content = page.getByText("Built in 42 seconds.");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(content).toBeHidden();

  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(content).toBeVisible();

  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(content).toBeHidden();
  await page.keyboard.press("Space");
  await expect(content).toBeVisible();
  await expect(page.locator("ds-collapsible")).toHaveAttribute("open", "");
});

test("Elements aspect ratio holds its box to the ratio and crops the media", async ({ page }) => {
  await mount(
    page,
    ["ds-aspect-ratio"],
    `<main>
      <div data-testid="frame">
        <ds-aspect-ratio ratio="16/9">
          <img alt="Chart" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10'/%3E" />
        </ds-aspect-ratio>
      </div>
    </main>`,
  );
  await page.addStyleTag({ content: "[data-testid='frame'] { inline-size: 320px; }" });

  const box = page.locator(".aspect-ratio");
  await expect(async () => {
    const rect = (await box.boundingBox())!;
    expect(rect.width).toBeCloseTo(320, 0);
    expect(rect.height).toBeCloseTo(180, 0);
    const image = (await page.getByRole("img", { name: "Chart" }).boundingBox())!;
    expect(image.width).toBeCloseTo(320, 0);
    expect(image.height).toBeCloseTo(180, 0);
  }).toPass();

  await page.locator("ds-aspect-ratio").evaluate((host) => host.setAttribute("ratio", "1"));
  await expect.poll(async () => (await box.boundingBox())!.height).toBeCloseTo(320, 0);
});

test("Elements meter, skeleton and blockquote expose their semantics", async ({ page }) => {
  await mount(
    page,
    ["ds-meter", "ds-skeleton", "ds-blockquote"],
    `<main>
      <ds-meter label="Disk usage" value="90" low="50" high="80" optimum="0"></ds-meter>
      <section aria-busy="true" aria-label="Profile">
        <ds-skeleton variant="circle"></ds-skeleton>
        <ds-skeleton lines="2" label="Loading profile"></ds-skeleton>
      </section>
      <ds-blockquote cite="Ada Lovelace">The engine weaves algebraic patterns.</ds-blockquote>
    </main>`,
  );

  const meter = page.getByRole("meter", { name: "Disk usage" });
  await expect(meter).toHaveAttribute("aria-valuenow", "90");
  await expect(meter.locator(".meter__indicator")).toHaveAttribute("data-quality", "poor");
  await expect(async () => {
    const track = (await meter.boundingBox())!;
    const fill = (await meter.locator(".meter__indicator").boundingBox())!;
    expect(Math.abs(fill.width / track.width - 0.9)).toBeLessThan(0.05);
  }).toPass();

  await expect(page.getByRole("status", { name: "Loading profile" })).toBeVisible();
  await expect(page.locator(".skeleton[aria-hidden='true']")).toHaveCount(1);

  await expect(page.locator("blockquote")).toHaveText("The engine weaves algebraic patterns.");
  await expect(page.locator("figcaption")).toHaveText("Ada Lovelace");
});

test("Elements skeleton stops its animation under reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await mount(page, ["ds-skeleton"], `<ds-skeleton animation="wave"></ds-skeleton>`);
  await expect(page.locator(".skeleton__bar").first()).toHaveCSS("animation-name", "none");
});

test.describe("Elements accordion and display at 320 CSS pixels", () => {
  test.use({ viewport: { width: 320, height: 640 } });

  test("stays within the width", async ({ page }) => {
    await mount(
      page,
      [
        "ds-accordion",
        "ds-accordion-item",
        "ds-collapsible",
        "ds-aspect-ratio",
        "ds-meter",
        "ds-blockquote",
      ],
      `<main>
        <ds-accordion value="shipping">
          <ds-accordion-item value="shipping" label="Shipping and delivery options for every region">
            Orders ship from the nearest warehouse within three to five working days.
          </ds-accordion-item>
          <ds-accordion-item value="returns" label="Returns">Returns within 30 days.</ds-accordion-item>
        </ds-accordion>
        <ds-collapsible label="Build details" open><p>Built in 42 seconds.</p></ds-collapsible>
        <ds-aspect-ratio ratio="16/9"><div>Preview</div></ds-aspect-ratio>
        <ds-meter label="Storage" value="40"></ds-meter>
        <ds-blockquote cite="Ada Lovelace">The engine weaves algebraic patterns.</ds-blockquote>
      </main>`,
    );

    await expect(page.getByRole("region", { name: /Shipping/ })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      320,
    );
  });
});
