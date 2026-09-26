import { expect, test, type Page } from "@playwright/test";
import { VUE_BASE } from "../playwright.config";

const ELEMENTS_BASE = VUE_BASE.replace("harness.html", "elements-harness.html");

// Loads the harness, waits for the tags and replaces the page with `markup`.
// Every host records the events it emits on `data-events`, in order.
const mount = async (page: Page, tags: string[], markup: string) => {
  await page.goto(ELEMENTS_BASE);
  await page.evaluate(
    async ({ tags, markup }) => {
      await Promise.all(tags.map((tag) => customElements.whenDefined(tag)));
      document.body.innerHTML = markup;
      for (const host of document.querySelectorAll<HTMLElement>("[data-testid]")) {
        for (const type of ["open-change", "dismiss", "confirm", "select"]) {
          host.addEventListener(type, (event) => {
            // Native events of the same name (an input's text `select`) are
            // not the element's own.
            if (!(event instanceof CustomEvent)) return;
            const detail = (event as CustomEvent<{ value?: string } | null>).detail;
            const entry = detail?.value !== undefined ? `${type}:${detail.value}` : type;
            host.dataset.events = [host.dataset.events, entry].filter(Boolean).join(" ");
          });
        }
      }
    },
    { tags, markup },
  );
};

// Safari only tabs to buttons when the system enables full keyboard access.
const tabReachesButtons = (browserName: string) => browserName !== "webkit";

const isModal = (page: Page) =>
  page.locator("dialog[open]").evaluate((node) => node.matches(":modal"));

test.describe("Elements alert dialog", () => {
  test.beforeEach(async ({ page }) => {
    await mount(
      page,
      ["ds-alert-dialog"],
      `<ds-alert-dialog
        data-testid="alert"
        trigger="Show notice"
        heading="Session expired"
        description="Sign in again to continue."
        dismiss-label="Got it"
        close-button
      ></ds-alert-dialog>`,
    );
  });

  test("opens a native modal alert with focus on its only action", async ({ page }) => {
    const trigger = page.getByRole("button", { name: "Show notice" });
    await trigger.click();

    const dialog = page.getByRole("alertdialog", { name: "Session expired" });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAccessibleDescription("Sign in again to continue.");
    expect(await isModal(page)).toBe(true);
    await expect(dialog.getByRole("button", { name: "Got it" })).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect(page.getByTestId("alert")).toHaveAttribute(
      "data-events",
      "open-change open-change dismiss",
    );
  });

  test("closes from the header close button and returns focus", async ({ page }) => {
    const trigger = page.getByRole("button", { name: "Show notice" });
    await trigger.press("Enter");
    const dialog = page.getByRole("alertdialog", { name: "Session expired" });
    await expect(dialog).toBeVisible();

    await dialog.getByRole("button", { name: "Close" }).click();
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect(page.getByTestId("alert")).toHaveAttribute(
      "data-events",
      "open-change open-change dismiss",
    );
  });
});

test.describe("Elements confirm dialog", () => {
  test.beforeEach(async ({ page }) => {
    await mount(
      page,
      ["ds-confirm-dialog"],
      `<ds-confirm-dialog
        data-testid="confirm"
        trigger="Delete project"
        heading="Delete this project?"
        description="The project and its files are removed."
        confirm-label="Delete"
        confirm-variant="danger"
      ></ds-confirm-dialog>`,
    );
  });

  test("starts on the safe choice and moves between the two actions", async ({
    page,
    browserName,
  }) => {
    const trigger = page.getByRole("button", { name: "Delete project" });
    await trigger.click();

    const dialog = page.getByRole("dialog", { name: "Delete this project?" });
    await expect(dialog).toBeVisible();
    expect(await isModal(page)).toBe(true);
    await expect(dialog.getByRole("button", { name: "Cancel" })).toBeFocused();
    // No close button was asked for.
    await expect(dialog.getByRole("button", { name: "Close" })).toBeHidden();

    if (tabReachesButtons(browserName)) {
      await page.keyboard.press("Tab");
      await expect(dialog.getByRole("button", { name: "Delete" })).toBeFocused();
      await page.keyboard.press("Shift+Tab");
      await expect(dialog.getByRole("button", { name: "Cancel" })).toBeFocused();
    }

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect(page.getByTestId("confirm")).toHaveAttribute(
      "data-events",
      "open-change open-change",
    );
  });

  test("confirms from the keyboard and reports it before closing", async ({ page }) => {
    const trigger = page.getByRole("button", { name: "Delete project" });
    await trigger.press("Enter");
    const dialog = page.getByRole("dialog", { name: "Delete this project?" });
    await dialog.getByRole("button", { name: "Delete" }).focus();
    await page.keyboard.press("Enter");

    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect(page.getByTestId("confirm")).toHaveAttribute(
      "data-events",
      "open-change confirm open-change",
    );
  });
});

test.describe("Elements prompt dialog", () => {
  test.beforeEach(async ({ page }) => {
    await mount(
      page,
      ["ds-prompt-dialog"],
      `<ds-prompt-dialog
        data-testid="prompt"
        trigger="Rename file"
        heading="Rename file"
        label="File name"
        value="notes.txt"
        required
        close-button
      ></ds-prompt-dialog>`,
    );
  });

  test("focuses the seeded input and confirms the typed value with Enter", async ({ page }) => {
    const trigger = page.getByRole("button", { name: "Rename file" });
    await trigger.click();

    const dialog = page.getByRole("dialog", { name: "Rename file" });
    await expect(dialog).toBeVisible();
    expect(await isModal(page)).toBe(true);
    const input = dialog.getByRole("textbox", { name: "File name" });
    await expect(input).toBeFocused();
    await expect(input).toHaveValue("notes.txt");

    await input.fill("");
    await expect(dialog.getByRole("button", { name: "Confirm" })).toBeDisabled();
    // A blank required value is not submitted.
    await input.press("Enter");
    await expect(dialog).toBeVisible();

    await input.fill("draft.txt");
    await expect(dialog.getByRole("button", { name: "Confirm" })).toBeEnabled();
    await input.press("Enter");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect(page.getByTestId("prompt")).toHaveAttribute(
      "data-events",
      "open-change confirm:draft.txt open-change",
    );
  });

  test("reseeds the input on each opening and closes from the close button", async ({ page }) => {
    const trigger = page.getByRole("button", { name: "Rename file" });
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: "Rename file" });
    const input = dialog.getByRole("textbox", { name: "File name" });
    await input.fill("discarded.txt");

    await dialog.getByRole("button", { name: "Close" }).click();
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();

    await trigger.press("Enter");
    await expect(input).toBeFocused();
    await expect(input).toHaveValue("notes.txt");
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(page.getByTestId("prompt")).not.toHaveAttribute("data-events", /confirm/);
  });
});

test.describe("Elements search dialog", () => {
  test.beforeEach(async ({ page }) => {
    await mount(
      page,
      ["ds-search-dialog"],
      `<ds-search-dialog data-testid="search" trigger="Open command palette"></ds-search-dialog>`,
    );
    await page.evaluate(() => {
      (document.querySelector("ds-search-dialog") as HTMLElement & { items: unknown }).items = [
        { value: "new-file", label: "New File", group: "Files" },
        { value: "open-file", label: "Open File", group: "Files" },
        { value: "settings", label: "Settings", group: "Preferences", shortcut: ["⌘", ","] },
        { value: "theme", label: "Change Theme", group: "Preferences" },
      ];
    });
  });

  test("filters as the user types and keeps focus in the input", async ({ page }) => {
    const trigger = page.getByRole("button", { name: "Open command palette" });
    await trigger.click();

    const dialog = page.getByRole("dialog", { name: "Search" });
    await expect(dialog).toBeVisible();
    expect(await isModal(page)).toBe(true);
    const input = dialog.getByRole("combobox", { name: "Search" });
    await expect(input).toBeFocused();
    await expect(dialog.getByRole("option")).toHaveCount(4);

    await page.keyboard.type("file");
    await expect(dialog.getByRole("option")).toHaveText(["New File", "Open File"]);
    await expect(dialog.getByRole("status")).toHaveText("2 results available");
    await expect(input).toBeFocused();

    await page.keyboard.type("zz");
    await expect(dialog.getByRole("option")).toHaveCount(0);
    await expect(dialog.getByRole("status")).toHaveText("No results found.");
    await expect(dialog.locator(".search-dialog__empty")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("moves the highlight with the arrow keys and picks with Enter", async ({ page }) => {
    const trigger = page.getByRole("button", { name: "Open command palette" });
    await trigger.press("Enter");
    const dialog = page.getByRole("dialog", { name: "Search" });
    const input = dialog.getByRole("combobox", { name: "Search" });
    await expect(input).toBeFocused();

    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    const active = await input.getAttribute("aria-activedescendant");
    expect(active).toBeTruthy();
    await expect(page.locator(`[id="${active}"]`)).toHaveText("Open File");
    // DOM focus never leaves the input; the option is only highlighted.
    await expect(input).toBeFocused();

    await page.keyboard.press("Enter");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect(page.getByTestId("search")).toHaveAttribute(
      "data-events",
      "open-change select:open-file open-change",
    );
  });

  test("starts each opening from a blank query", async ({ page }) => {
    const trigger = page.getByRole("button", { name: "Open command palette" });
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: "Search" });
    const input = dialog.getByRole("combobox", { name: "Search" });
    await page.keyboard.type("theme");
    await expect(dialog.getByRole("option")).toHaveText(["Change Theme"]);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();

    await trigger.click();
    await expect(input).toBeFocused();
    await expect(input).toHaveValue("");
    await expect(dialog.getByRole("option")).toHaveCount(4);
  });
});

test.describe("Elements dialogs at 320 CSS pixels", () => {
  test.use({ viewport: { width: 320, height: 640 } });

  test("the prompt and search dialogs fit without horizontal page overflow", async ({ page }) => {
    await mount(
      page,
      ["ds-prompt-dialog", "ds-search-dialog"],
      `<ds-prompt-dialog trigger="Rename" heading="Rename the selected file" label="File name"
        description="Use letters, numbers and dashes." close-button></ds-prompt-dialog>
      <ds-search-dialog trigger="Search"></ds-search-dialog>`,
    );
    await page.evaluate(() => {
      (document.querySelector("ds-search-dialog") as HTMLElement & { items: unknown }).items = [
        { value: "settings", label: "Settings", shortcut: ["⌘", ","] },
      ];
    });

    for (const name of ["Rename", "Search"]) {
      await page.getByRole("button", { name, exact: true }).click();
      const dialog = page.locator("dialog[open]");
      await expect(dialog).toBeVisible();
      const box = (await dialog.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(320);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        320,
      );
      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden();
    }
  });
});
