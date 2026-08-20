import { expect, test, type Locator, type Page } from "@playwright/test";
import { VUE_BASE } from "../playwright.config";

// Composition contract A: overlays inside overlays. Escape pops exactly one
// layer, an inner overlay's outside-press stays inside its own layer, focus
// returns to the trigger that opened each layer, and a tooltip on an overlay
// trigger does not name the trigger twice.
//
// Two independent consumers: the Svelte docs demo and the Vue harness. Both
// compose the same shape (edit dialog + form overlays + confirm-on-close).

interface Consumer {
  name: string;
  open: (page: Page) => Promise<Locator>;
}

const svelte: Consumer = {
  name: "Svelte docs",
  open: async (page) => {
    await page.goto("components/feedback/dialog/");
    const scope = page
      .locator("astro-island")
      .filter({ has: page.getByRole("button", { name: "Edit profile" }) })
      .first();
    await scope.getByRole("button", { name: "Edit profile" }).scrollIntoViewIfNeeded();
    await expect(scope).not.toHaveAttribute("ssr", "");
    return scope;
  },
};

const vue: Consumer = {
  name: "Vue harness",
  open: async (page) => {
    await page.goto(VUE_BASE);
    const scope = page.locator("section.harness-overlay-composition");
    await expect(scope.getByRole("button", { name: "Edit profile" })).toBeVisible();
    return scope;
  },
};

const dialog = (page: Page, name: string) => page.getByRole("dialog", { name });

for (const consumer of [svelte, vue]) {
  test.describe(`overlay composition — ${consumer.name}`, () => {
    test("Escape pops one layer at a time and returns focus to each trigger", async ({ page }) => {
      const scope = await consumer.open(page);
      const trigger = scope.getByRole("button", { name: "Edit profile" });
      await trigger.click();
      const editor = dialog(page, "Edit profile");
      await expect(editor).toBeVisible();

      const discard = editor.getByRole("button", { name: "Discard" });
      await discard.click();
      const confirm = dialog(page, "Discard changes?");
      await expect(confirm).toBeVisible();

      // Escape #1 closes only the confirm; the editor survives and focus
      // returns to the control that opened the confirm.
      await page.keyboard.press("Escape");
      await expect(confirm).toBeHidden();
      await expect(editor).toBeVisible();
      await expect(discard).toBeFocused();

      // Escape #2 closes the editor and focus returns to the page trigger.
      await page.keyboard.press("Escape");
      await expect(editor).toBeHidden();
      await expect(trigger).toBeFocused();
    });

    test("a listbox inside the dialog closes on Escape without closing the dialog", async ({
      page,
    }) => {
      const scope = await consumer.open(page);
      await scope.getByRole("button", { name: "Edit profile" }).click();
      const editor = dialog(page, "Edit profile");
      const city = editor.getByRole("combobox", { name: "City" });
      await city.click();
      const listbox = page.getByRole("listbox").last();
      await expect(listbox).toBeVisible();
      // The portaled listbox is operable even though the dialog owns the top layer.
      await expect(listbox.getByRole("option", { name: "Milan" })).toBeVisible();

      await page.keyboard.press("Escape");
      await expect(listbox).toBeHidden();
      await expect(editor).toBeVisible();
      await expect(city).toBeFocused();

      await page.keyboard.press("Escape");
      await expect(editor).toBeHidden();
    });

    test("selecting from the portaled listbox keeps the dialog open", async ({ page }) => {
      const scope = await consumer.open(page);
      await scope.getByRole("button", { name: "Edit profile" }).click();
      const editor = dialog(page, "Edit profile");
      const city = editor.getByRole("combobox", { name: "City" });
      await city.click();
      await page.getByRole("option", { name: "Tokyo" }).last().click();
      // An outside press that lands in the dialog's own overlay must not
      // dismiss the dialog underneath it.
      await expect(editor).toBeVisible();
      await expect(city).toHaveValue("Tokyo");
    });

    test("the tooltip on the dialog trigger names it once", async ({ page }) => {
      const scope = await consumer.open(page);
      const trigger = scope.getByRole("button", { name: "Edit profile" });
      await trigger.hover();
      const tooltip = page.getByRole("tooltip");
      await expect(tooltip).toBeVisible();
      // The trigger keeps its own single name: the tooltip text is never
      // folded into it, so the button is announced once.
      await expect(trigger).toHaveAccessibleName("Edit profile");
      // The description sits on the Tooltip's own wrapper (documented model:
      // the wrapper is described, and the headless seam exists for putting
      // aria-describedby on a specific element).
      const wrapper = scope.locator(".tooltip__trigger").first();
      await expect(wrapper).toHaveAttribute("aria-describedby", /.+/);
      const describedBy = await wrapper.getAttribute("aria-describedby");
      await expect(page.locator(`#${describedBy}`)).toHaveText("Update your profile details");
    });

    test("multi select inside the dialog keeps removal focus and stays usable at 320px", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 320, height: 720 });
      const scope = await consumer.open(page);
      await scope.getByRole("button", { name: "Edit profile" }).click();
      const editor = dialog(page, "Edit profile");
      const remove = editor.getByRole("button", { name: /^Remove / }).first();
      const removeName = await remove.getAttribute("aria-label");
      await remove.click();
      // Focus moves along the tag chain (or to the input when none remain),
      // never to the document body.
      const focused = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        return { tag: el?.tagName ?? "", name: el?.getAttribute("aria-label") ?? el?.id ?? "" };
      });
      expect(focused.tag).not.toBe("BODY");
      expect(focused.name).not.toBe(removeName);
      await expect(editor).toBeVisible();
      // The panel fits the narrow viewport; its body scrolls instead.
      const box = await editor.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x + box!.width).toBeLessThanOrEqual(321);
    });
  });
}
