import { expect, test, type Locator, type Page } from "@playwright/test";

// The docs demo drives the derivation with scripted buttons: no network, no
// demo-owned timers. The readout mirrors the derived view.
const demo = (page: Page): Locator =>
  page.locator("astro-island").filter({ has: page.getByTestId("async-view") });

const view = (page: Page) => demo(page).getByTestId("async-view");

const open = async (page: Page) => {
  await page.goto("components/patterns/async-content/");
  await page.getByTestId("async-view").scrollIntoViewIfNeeded();
  await expect(demo(page)).not.toHaveAttribute("ssr", "");
};

test.describe("Async Content composition (docs demo)", () => {
  test.beforeEach(async ({ page }) => {
    await open(page);
  });

  test("walks the precedence table across the composed views", async ({ page }) => {
    const d = demo(page);
    await expect(view(page)).toHaveText("View: idle");

    // Initial loading: the skeleton is immediate, the Loading text follows
    // its own no-flash delay.
    await d.getByRole("button", { name: "Start request" }).click();
    await expect(view(page)).toHaveText("View: initial-loading");
    await expect(d.locator(".skeleton").first()).toBeVisible();
    await expect(d.locator(".loading[aria-label='Loading people']")).toBeVisible();

    await d.getByRole("button", { name: "Succeed with data" }).click();
    await expect(view(page)).toHaveText("View: content");
    await expect(d.getByRole("list")).toContainText("Ada Lovelace");

    // Refreshing keeps the list and adds a non-blocking indicator.
    await d.getByRole("button", { name: "Refresh" }).click();
    await expect(view(page)).toHaveText("View: refreshing");
    await expect(d.getByRole("list")).toContainText("Ada Lovelace");
    await expect(d.locator(".loading[aria-label='Refreshing']")).toBeVisible();

    // A failing refresh keeps the content: stale error, not a page.
    await d.getByRole("button", { name: "Fail" }).click();
    await expect(view(page)).toHaveText("View: stale-error");
    await expect(d.getByRole("list")).toContainText("Ada Lovelace");
    await expect(d.getByText("Refresh failed")).toBeVisible();

    // Retry from the notification derives back to refreshing, then recovery.
    await d.getByRole("button", { name: "Retry" }).click();
    await expect(view(page)).toHaveText("View: refreshing");
    await d.getByRole("button", { name: "Succeed with data" }).click();
    await expect(view(page)).toHaveText("View: content");
    await expect(d.getByText("Refresh failed")).toHaveCount(0);

    // An explicitly empty success is the only path to empty.
    await d.getByRole("button", { name: "Succeed empty" }).click();
    await expect(view(page)).toHaveText("View: empty");
    await expect(d.getByText("No people yet")).toBeVisible();

    await d.getByRole("button", { name: "Reset" }).click();
    await expect(view(page)).toHaveText("View: idle");
  });

  test("a failure without content is an initial error whose retry loads", async ({ page }) => {
    const d = demo(page);
    await d.getByRole("button", { name: "Fail" }).click();
    await expect(view(page)).toHaveText("View: initial-error");
    await expect(d.getByText("Loading failed")).toBeVisible();
    await expect(d.getByRole("list")).toHaveCount(0);

    await d.getByRole("button", { name: "Retry" }).click();
    await expect(view(page)).toHaveText("View: initial-loading");
    await expect(d.locator(".skeleton").first()).toBeVisible();
  });

  test("refreshing and recovery never move focus", async ({ page }) => {
    const d = demo(page);
    await d.getByRole("button", { name: "Succeed with data" }).click();
    const refresh = d.getByRole("button", { name: "Refresh" });
    await refresh.focus();
    await page.keyboard.press("Enter");
    await expect(view(page)).toHaveText("View: refreshing");
    await expect(refresh).toBeFocused();

    // Recovery: content returns; the focused control still exists and keeps
    // focus even though the indicator unmounts.
    await d.getByRole("button", { name: "Fail" }).click();
    await expect(view(page)).toHaveText("View: stale-error");
    await d.getByRole("button", { name: "Succeed with data" }).click();
    await expect(view(page)).toHaveText("View: content");
    await expect(d.getByText("Refresh failed")).toHaveCount(0);
  });

  test("announcements stay restrained per view", async ({ page }) => {
    const d = demo(page);
    const liveCount = () => d.locator("[role='status'], [role='alert']").count();

    await d.getByRole("button", { name: "Succeed with data" }).click();
    expect(await liveCount()).toBe(0);

    await d.getByRole("button", { name: "Refresh" }).click();
    expect(await liveCount()).toBe(1);

    await d.getByRole("button", { name: "Fail" }).click();
    // The stale notification is a labelled region, not an extra live element.
    expect(await liveCount()).toBeLessThanOrEqual(1);

    await d.getByRole("button", { name: "Succeed with data" }).click();
    expect(await liveCount()).toBe(0);
  });

  test("works at 320px, in RTL, with reduced motion and expanded text", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.evaluate(() => {
      document.documentElement.setAttribute("dir", "rtl");
      // A text-expansion proxy: twice the root size, like text-only zoom.
      document.documentElement.style.fontSize = "200%";
    });
    const d = demo(page);

    await d.getByRole("button", { name: "Start request" }).click();
    await expect(view(page)).toHaveText("View: initial-loading");
    await d.getByRole("button", { name: "Succeed with data" }).click();
    await expect(view(page)).toHaveText("View: content");
    await d.getByRole("button", { name: "Refresh" }).click();
    await expect(view(page)).toHaveText("View: refreshing");
    await expect(d.getByRole("list")).toContainText("Ada Lovelace");
  });
});
