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

const SOURCE = [
  "pnpm install",
  `pnpm exec turbo run build --force --filter=@design-system/elements ${"--verbose ".repeat(12)}`,
].join("\n");

const setSource = (page: Page, code: string) =>
  page.evaluate((code) => {
    (document.querySelector("ds-code-block") as HTMLElement & { code: string }).code = code;
  }, code);

test("Elements code block copies its source and announces it", async ({
  page,
  context,
  browserName,
}) => {
  // Only Chromium grants clipboard access to a page on request; the other
  // engines get a recording stand-in, so the button and the announcement are
  // still checked there.
  if (browserName === "chromium") {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  } else {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          writeText: async (text: string) => {
            (window as unknown as { copied: string }).copied = text;
          },
        },
      });
    });
  }
  await mount(
    page,
    ["ds-code-block"],
    `<main><ds-code-block language="bash"></ds-code-block></main>`,
  );
  await setSource(page, SOURCE);

  await expect(page.getByRole("group", { name: "Code: bash" })).toBeVisible();
  const button = page.getByRole("button", { name: "Copy code" });
  await expect(button).toHaveText("Copy");
  await button.click();
  await expect(button).toHaveText("Copied");
  await expect(page.getByRole("status")).toHaveText("Copied to clipboard");

  const copied =
    browserName === "chromium"
      ? await page.evaluate(() => navigator.clipboard.readText())
      : await page.evaluate(() => (window as unknown as { copied: string }).copied);
  expect(copied).toBe(SOURCE);

  // The confirmation clears on its own.
  await expect(button).toHaveText("Copy", { timeout: 5000 });
  await expect(page.getByRole("status")).toHaveText("");
});

test("Elements code block keeps a hostile source as text", async ({ page }) => {
  await mount(page, ["ds-code-block", "ds-code"], `<main><ds-code-block></ds-code-block></main>`);
  const hostile = `<img src=x onerror="window.pwned = true"><script>window.pwned = true</script>`;
  await setSource(page, hostile);
  const code = page.locator("code.code-block__code");
  await expect(code).toHaveText(hostile);
  await expect(code.locator("img, script")).toHaveCount(0);
  expect(await page.evaluate(() => (window as unknown as { pwned?: boolean }).pwned)).toBeFalsy();
});

test("Elements inline code and feedback icons render their semantics", async ({ page }) => {
  await mount(
    page,
    ["ds-code", "ds-feedback-icon"],
    `<main>
      <p>Run <ds-code>pnpm install</ds-code> first.</p>
      <ds-feedback-icon status="success" label="Saved"></ds-feedback-icon>
      <ds-feedback-icon status="danger" box="solid" shape="round" data-testid="decorative"></ds-feedback-icon>
    </main>`,
  );
  await expect(page.locator("code.code")).toHaveText("pnpm install");

  const saved = page.getByRole("img", { name: "Saved" });
  await expect(saved).toBeVisible();
  await expect(saved).toHaveAttribute("data-status", "success");
  const box = (await saved.boundingBox())!;
  expect(box.width).toBeGreaterThan(0);
  expect(Math.abs(box.width - box.height)).toBeLessThan(1);

  const decorative = page.getByTestId("decorative").locator(".feedback-icon");
  await expect(decorative).toHaveAttribute("aria-hidden", "true");
  // A round box is a circle.
  expect(await decorative.evaluate((node) => getComputedStyle(node).borderTopLeftRadius)).toBe(
    "50%",
  );
});

const PHOTOS = [
  { title: "Peaks", description: "Above the clouds." },
  { title: "Valley", description: "Down by the river." },
  { title: "Forest", description: "Among the pines." },
];

const mountCarousel = async (page: Page, attributes = "") => {
  await mount(
    page,
    ["ds-carousel"],
    `<main><ds-carousel label="Featured photos" ${attributes}></ds-carousel></main>`,
  );
  await page.evaluate((items) => {
    (document.querySelector("ds-carousel") as HTMLElement & { items: unknown }).items = items;
  }, PHOTOS);
};

test("Elements carousel moves with its buttons, its dots and the arrow keys", async ({ page }) => {
  await mountCarousel(page);
  const carousel = page.getByRole("group", { name: "Featured photos" });
  const slides = page.locator(".carousel__slide");
  const active = page.locator(".carousel__slide[data-active]");
  const next = page.getByRole("button", { name: "Next slide" });
  const prev = page.getByRole("button", { name: "Previous slide" });

  await expect(carousel).toHaveAttribute("aria-roledescription", "carousel");
  await expect(slides).toHaveCount(3);
  await expect(active).toHaveAttribute("aria-label", "1 of 3");
  await expect(prev).toBeDisabled();
  await expect(page.getByText("Peaks")).toBeVisible();
  // An off-screen slide is hidden and inert.
  await expect(slides.nth(1)).toHaveAttribute("aria-hidden", "true");
  expect(await slides.nth(1).evaluate((node) => (node as HTMLElement).inert)).toBe(true);

  await next.click();
  await expect(active).toHaveAttribute("aria-label", "2 of 3");
  await expect(page.getByText("Valley")).toBeVisible();

  // The arrow keys move the carousel from any control inside it.
  await next.focus();
  await page.keyboard.press("ArrowRight");
  await expect(active).toHaveAttribute("aria-label", "3 of 3");
  await expect(next).toBeDisabled();
  // The disabled arrow hands its focus to the other one.
  await expect(prev).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await expect(active).toHaveAttribute("aria-label", "2 of 3");

  await prev.click();
  await expect(active).toHaveAttribute("aria-label", "1 of 3");

  const dot = page.getByRole("button", { name: "Go to slide 3" });
  await dot.click();
  await expect(active).toHaveAttribute("aria-label", "3 of 3");
  await expect(dot).toHaveAttribute("aria-current", "true");
  await expect(page.getByText("Forest")).toBeVisible();
  await expect(slides.first()).toHaveAttribute("aria-hidden", "true");
  await expect(page.locator("ds-carousel")).toHaveAttribute("index", "2");
});

test("Elements carousel reports each change and wraps when looping", async ({ page }) => {
  await mountCarousel(page, "loop");
  await page.evaluate(() => {
    const host = document.querySelector("ds-carousel")!;
    (window as unknown as { changes: number[] }).changes = [];
    host.addEventListener("change", (event) =>
      (window as unknown as { changes: number[] }).changes.push(
        (event as CustomEvent<{ index: number }>).detail.index,
      ),
    );
  });
  await page.getByRole("button", { name: "Previous slide" }).click();
  await expect(page.locator(".carousel__slide[data-active]")).toHaveAttribute(
    "aria-label",
    "3 of 3",
  );
  await page.getByRole("button", { name: "Next slide" }).click();
  expect(await page.evaluate(() => (window as unknown as { changes: number[] }).changes)).toEqual([
    2, 0,
  ]);
});

test.describe("Elements code, feedback and carousel at 320 CSS pixels", () => {
  test.use({ viewport: { width: 320, height: 640 } });

  test("the code block scrolls sideways by keyboard and nothing widens the page", async ({
    page,
    browserName,
  }) => {
    await mount(
      page,
      ["ds-code-block", "ds-carousel", "ds-feedback-icon"],
      `<main>
        <input aria-label="Before" />
        <ds-code-block language="bash"></ds-code-block>
        <ds-feedback-icon status="info" label="Information"></ds-feedback-icon>
        <ds-carousel label="Featured photos"></ds-carousel>
      </main>`,
    );
    await setSource(page, SOURCE);
    await page.evaluate((items) => {
      (document.querySelector("ds-carousel") as HTMLElement & { items: unknown }).items = items;
    }, PHOTOS);

    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      320,
    );
    await expect(page.getByRole("button", { name: "Next slide" })).toBeVisible();

    const scroller = page.getByRole("group", { name: "Code sample, bash" });
    expect(await scroller.evaluate((node) => node.scrollWidth > node.clientWidth)).toBe(true);
    // The scroller is a tab stop after the copy button.
    await page.getByRole("textbox", { name: "Before" }).focus();
    await page.keyboard.press("Tab");
    if (browserName !== "webkit") {
      // Safari tabs to buttons only with full keyboard access.
      await expect(page.getByRole("button", { name: "Copy code" })).toBeFocused();
      await page.keyboard.press("Tab");
    }
    await expect(scroller).toBeFocused();
    // WebKit scrolls no focused element sideways from the keyboard, a plain
    // overflow box included, so the arrow is checked on the other engines.
    if (browserName !== "webkit") {
      await page.keyboard.press("ArrowRight");
      await expect.poll(() => scroller.evaluate((node) => node.scrollLeft)).toBeGreaterThan(0);
    }
  });
});
