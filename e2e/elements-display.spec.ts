import { expect, test, type Page } from "@playwright/test";
import { VUE_BASE } from "../playwright.config";

const ELEMENTS_BASE = VUE_BASE.replace("harness.html", "elements-harness.html");
const SEARCH = "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35";

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

const TRAIL = [
  { label: "Home", href: "#home", home: true },
  { label: "Warehouse", href: "#warehouse" },
  { label: "Sales schema", href: "#sales" },
  { label: "Customer orders by region and quarter" },
];

test("Elements breadcrumb marks the current page and links only the ancestors", async ({
  page,
}) => {
  await mount(page, ["ds-breadcrumb"], `<ds-breadcrumb label="You are here"></ds-breadcrumb>`);
  await page.evaluate((items) => {
    (document.querySelector("ds-breadcrumb") as HTMLElement & { items: unknown }).items = items;
  }, TRAIL);

  const nav = page.getByRole("navigation", { name: "You are here" });
  await expect(nav.getByRole("listitem")).toHaveCount(4);
  await expect(nav.getByRole("link")).toHaveCount(3);
  await expect(nav.getByRole("link", { name: "Home" })).toHaveAttribute("href", "#home");
  const current = nav.locator("[aria-current='page']");
  await expect(current).toHaveText("Customer orders by region and quarter");
  expect(await current.evaluate((node) => node.closest("a"))).toBeNull();

  await nav.getByRole("link", { name: "Warehouse" }).click();
  await expect(page).toHaveURL(/#warehouse$/);
});

test("Elements progress exposes its range and fills the track in proportion", async ({ page }) => {
  await mount(
    page,
    ["ds-progress"],
    `<main>
      <ds-progress label="Upload" value="25"></ds-progress>
      <ds-progress label="Quota" value="3" min="0" max="12" shape="circle" show-value></ds-progress>
    </main>`,
  );

  const upload = page.getByRole("progressbar", { name: "Upload" });
  await expect(upload).toHaveAttribute("aria-valuenow", "25");
  await expect(upload).toHaveAttribute("aria-valuemin", "0");
  await expect(upload).toHaveAttribute("aria-valuemax", "100");

  await page.locator("ds-progress[label='Upload']").evaluate((host) => {
    host.setAttribute("value", "60");
  });
  await expect(upload).toHaveAttribute("aria-valuenow", "60");
  const fill = upload.locator(".progress__indicator");
  await expect(async () => {
    const track = (await upload.boundingBox())!;
    const bar = (await fill.boundingBox())!;
    expect(Math.abs(bar.width / track.width - 0.6)).toBeLessThan(0.05);
  }).toPass();

  const quota = page.getByRole("progressbar", { name: "Quota" });
  await expect(quota).toHaveAttribute("aria-valuenow", "3");
  await expect(quota).toHaveAttribute("aria-valuemax", "12");
  await expect(quota).toContainText("25%");
});

test("Elements scroll area viewport takes focus and scrolls from the keyboard", async ({
  page,
  browserName,
}) => {
  const rows = Array.from({ length: 40 }, (_, index) => `<p>Log line ${index + 1}</p>`).join("");
  await mount(
    page,
    ["ds-scroll-area"],
    `<main>
      <input aria-label="Before" />
      <ds-scroll-area label="Build log" max-height="8rem">${rows}</ds-scroll-area>
    </main>`,
  );

  const region = page.getByRole("region", { name: "Build log" });
  await page.getByRole("textbox", { name: "Before" }).focus();
  await page.keyboard.press("Tab");
  await expect(region).toBeFocused();

  const thumb = page.locator(".scroll-area__bar--v > *");
  await expect(thumb).toBeAttached();
  const scrollTop = () => region.evaluate((node) => node.scrollTop);
  expect(await scrollTop()).toBe(0);

  // WebKit drops an occasional arrow-key scroll on the focused viewport; its
  // page keys are reliable.
  if (browserName !== "webkit") {
    await page.keyboard.press("ArrowDown");
    await expect.poll(scrollTop).toBeGreaterThan(0);
  }
  const before = await scrollTop();
  await page.keyboard.press("PageDown");
  await expect.poll(scrollTop).toBeGreaterThan(before);
  await page.keyboard.press("End");
  await expect
    .poll(() => region.evaluate((node) => node.scrollTop + node.clientHeight - node.scrollHeight))
    .toBeGreaterThan(-2);
  // The custom thumb follows the native scroll position.
  await expect
    .poll(() => thumb.evaluate((node) => parseFloat((node as HTMLElement).style.insetBlockStart)))
    .toBeGreaterThan(50);

  await page.keyboard.press("Home");
  await expect.poll(scrollTop).toBe(0);
  await expect(region).toBeFocused();
});

test("Elements avatar group collapses the overflow into a named chip", async ({ page }) => {
  await mount(
    page,
    ["ds-avatar-group", "ds-avatar"],
    `<ds-avatar-group label="Reviewers" max="3"></ds-avatar-group>`,
  );
  await page.evaluate(() => {
    (document.querySelector("ds-avatar-group") as HTMLElement & { items: unknown }).items = [
      { name: "Ada Lovelace" },
      { name: "Grace Hopper" },
      { name: "Alan Turing" },
      { name: "Edsger Dijkstra" },
      { name: "Barbara Liskov" },
    ];
  });

  const group = page.getByRole("group", { name: "Reviewers" });
  await expect(group.getByRole("img")).toHaveCount(4);
  await expect(group.getByRole("img", { name: "Ada Lovelace" })).toHaveText("AL");
  const chip = group.getByRole("img", { name: "2 more" });
  await expect(chip).toHaveText("+2");
  await expect(chip).toBeVisible();
});

test("Elements kbd, icon, link and button group keep their native semantics", async ({
  page,
  browserName,
}) => {
  await mount(
    page,
    ["ds-kbd", "ds-icon", "ds-link", "ds-button-group", "ds-button"],
    `<main>
      <p>Press <ds-kbd keys="Ctrl K"></ds-kbd> or <ds-kbd>Esc</ds-kbd>.</p>
      <p>
        <ds-icon path="${SEARCH}" label="Search"></ds-icon>
        <ds-icon path="${SEARCH}" data-testid="decorative"></ds-icon>
      </p>
      <p>
        <ds-link href="#guide">Read the guide</ds-link>
        <ds-link href="elements-harness.html" external>Open the harness</ds-link>
      </p>
      <ds-button-group label="Pagination">
        <ds-button>Previous</ds-button>
        <ds-button>Next</ds-button>
      </ds-button-group>
    </main>`,
  );

  // A chord is one <kbd> of nested keycaps; the "+" between them is visual.
  const chord = page.locator("kbd.kbd--chord");
  await expect(chord).toHaveText("Ctrl+K");
  await expect(chord.locator("kbd.kbd__key")).toHaveText(["Ctrl", "K"]);
  await expect(chord.locator(".kbd__sep")).toHaveAttribute("aria-hidden", "true");
  await expect(page.locator("kbd.kbd__key", { hasText: "Esc" })).toBeVisible();

  const icon = page.getByRole("img", { name: "Search" });
  await expect(icon).toBeVisible();
  const box = (await icon.boundingBox())!;
  expect(box.width).toBeGreaterThan(0);
  expect(Math.abs(box.width - box.height)).toBeLessThan(1);
  await expect(page.getByTestId("decorative").locator("svg")).toHaveAttribute(
    "aria-hidden",
    "true",
  );

  const external = page.getByRole("link", { name: "Open the harness" });
  await expect(external).toHaveAttribute("target", "_blank");
  await expect(external).toHaveAttribute("rel", "noopener noreferrer");
  const [popup] = await Promise.all([page.waitForEvent("popup"), external.click()]);
  await popup.waitForLoadState();
  expect(popup.url()).toContain("elements-harness.html");
  // noopener: the new tab gets no handle back to this page.
  expect(await popup.evaluate(() => window.opener)).toBeNull();
  await popup.close();

  const internal = page.getByRole("link", { name: "Read the guide" });
  await expect(internal).not.toHaveAttribute("target");
  await internal.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#guide$/);

  const group = page.getByRole("group", { name: "Pagination" });
  const previous = group.getByRole("button", { name: "Previous" });
  const next = group.getByRole("button", { name: "Next" });
  await expect(group.getByRole("button")).toHaveCount(2);
  if (browserName !== "webkit") {
    // Each button stays its own tab stop (Safari tabs to buttons only with
    // full keyboard access).
    await previous.focus();
    await page.keyboard.press("Tab");
    await expect(next).toBeFocused();
  }
  // Attached: the buttons touch, one bar.
  const a = (await previous.boundingBox())!;
  const b = (await next.boundingBox())!;
  expect(Math.abs(b.x - (a.x + a.width))).toBeLessThan(2);
});

test.describe("Elements display at 320 CSS pixels", () => {
  test.use({ viewport: { width: 320, height: 640 } });

  test("breadcrumb, avatar group and scroll area stay within the width", async ({
    page,
    browserName,
  }) => {
    await mount(
      page,
      ["ds-breadcrumb", "ds-avatar-group", "ds-scroll-area"],
      `<main>
        <ds-breadcrumb></ds-breadcrumb>
        <ds-avatar-group label="Reviewers" max="6"></ds-avatar-group>
        <ds-scroll-area label="Wide log" orientation="both" max-height="6rem">
          <pre>${"0123456789 ".repeat(20)}</pre>
        </ds-scroll-area>
      </main>`,
    );
    await page.evaluate((items) => {
      (document.querySelector("ds-breadcrumb") as HTMLElement & { items: unknown }).items = items;
      (document.querySelector("ds-avatar-group") as HTMLElement & { items: unknown }).items =
        Array.from({ length: 8 }, (_, index) => ({ name: `Person ${index + 1}` }));
    }, TRAIL);

    await expect(page.locator("[aria-current='page']")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      320,
    );
    // The wide content scrolls inside its own viewport, not the page.
    const region = page.getByRole("region", { name: "Wide log" });
    expect(await region.evaluate((node) => node.scrollWidth > node.clientWidth)).toBe(true);
    // WebKit scrolls no focused element sideways from the keyboard, a plain
    // overflow box included, so the arrow is checked on the other engines.
    if (browserName !== "webkit") {
      await region.focus();
      await page.keyboard.press("ArrowRight");
      await expect.poll(() => region.evaluate((node) => node.scrollLeft)).toBeGreaterThan(0);
    }
  });
});
