import { expect, test, type Page } from "@playwright/test";
import { VUE_BASE } from "../playwright.config";

// The React harness is client-rendered, which is the render that shows these
// defects: server-rendered markup carries defaults of its own and hides them.
const REACT_BASE = VUE_BASE.replace("harness.html", "react-harness.html");

const payload = (page: Page) =>
  page.evaluate(() => {
    const form = document.querySelector("[data-testid='reset-form']") as HTMLFormElement;
    const data = new FormData(form);
    return Object.fromEntries(
      [...new Set(data.keys())].map((key) => [key, data.getAll(key).join("|")]),
    );
  });

/** The defaults the DOM itself carries: the layer a restore would hide. */
const domDefaults = (page: Page) =>
  page.evaluate(() => {
    const form = document.querySelector("[data-testid='reset-form']") as HTMLFormElement;
    return {
      checked: [...form.querySelectorAll<HTMLInputElement>("input[type=checkbox]")]
        .filter((input) => input.defaultChecked)
        .map((input) => input.name)
        .sort(),
      selected: [...form.querySelectorAll<HTMLOptionElement>("select option")]
        .filter((option) => option.defaultSelected)
        .map((option) => option.value),
    };
  });

const reports = async (page: Page) =>
  Number(/Reports: (\d+)/.exec((await page.getByTestId("reset-readout").textContent()) ?? "")?.[1]);

/** These inputs are painted over, so the label is what a person clicks. */
const press = (control: ReturnType<Page["getByRole"]>) =>
  control.locator("xpath=ancestor::label[1]").click();

const edit = async (page: Page) => {
  await press(page.getByRole("checkbox", { name: "Subscribe" }));
  await press(page.getByRole("switch", { name: "Notifications" }));
  await page.getByLabel("Fruit").selectOption("apple");
  // The chevron shows every option; pressing the box itself opens the list
  // filtered by the text already in it, which is the current selection.
  await page.getByRole("button", { name: "Show options" }).first().click();
  await page.getByRole("option", { name: "London" }).click();
  await page.getByRole("combobox", { name: "Languages" }).click();
  await page.getByRole("option", { name: "English" }).click();
  await page.keyboard.press("Escape");
};

const MOUNTED = {
  resetSubscribe: "on",
  resetNotify: "on",
  resetFruit: "pear",
  resetCity: "milan",
  resetLangs: "it",
};

test.beforeEach(async ({ page }) => {
  await page.goto(REACT_BASE);
  await expect(page.getByRole("checkbox", { name: "Subscribe" })).toBeVisible();
});

test("a reset restores payload and page, and reports nothing", async ({ page }) => {
  expect(await payload(page)).toEqual(MOUNTED);
  const defaults = await domDefaults(page);
  expect(defaults.checked, "the DOM must carry the checked defaults").toEqual([
    "resetNotify",
    "resetSubscribe",
  ]);
  expect(defaults.selected, "the DOM must carry the selected option").toEqual(["pear"]);

  await edit(page);
  const edited = await payload(page);
  expect(edited.resetSubscribe).toBeUndefined();
  expect(edited.resetNotify).toBeUndefined();
  expect(edited.resetFruit).toBe("apple");
  expect(edited.resetCity).toBe("london");
  expect(await domDefaults(page), "the DOM defaults must not follow the edits").toEqual(defaults);
  const reported = await reports(page);
  expect(reported, "the edits themselves must have been reported").toBeGreaterThan(0);

  await page.getByRole("button", { name: "Reset the form" }).click();
  // The components' restore follows the browser's by one task.
  await page.waitForTimeout(50);

  expect(await payload(page)).toEqual(MOUNTED);
  await expect(page.getByRole("checkbox", { name: "Subscribe" })).toBeChecked();
  await expect(page.getByRole("switch", { name: "Notifications" })).toBeChecked();
  await expect(page.getByRole("combobox", { name: "City" })).toHaveValue("Milan");
  await expect(page.getByTestId("reset-readout")).toContainText("Resets: 1");
  expect(await reports(page), "a reset is not a user change").toBe(reported);
});

test("a cancelled reset restores nothing", async ({ page }) => {
  await page.evaluate(() => {
    document
      .querySelector("[data-testid='reset-form']")!
      .addEventListener("reset", (event) => event.preventDefault());
  });

  await edit(page);
  const edited = await payload(page);

  await page.getByRole("button", { name: "Reset the form" }).click();
  await page.waitForTimeout(50);

  expect(await payload(page), "preventDefault must leave the edits alone").toEqual(edited);
  await expect(page.getByRole("checkbox", { name: "Subscribe" })).not.toBeChecked();
});

test("the page's own choice becomes the default a reset restores", async ({ page }) => {
  // Chosen by the page while the controls still hold the mounted values, so
  // this is a choice and not an echo of anything a user did. Editing first
  // would leave the page setting values the controls already have, which is
  // no change at all.
  await page.getByRole("button", { name: "Choose for me" }).click();
  const defaults = await domDefaults(page);
  expect(defaults.checked, "the page's choice did not become the default").toEqual([]);
  expect(defaults.selected).toEqual(["apple"]);

  await page.getByRole("button", { name: "Reset the form" }).click();
  await page.waitForTimeout(50);

  const after = await payload(page);
  expect(after.resetSubscribe).toBeUndefined();
  expect(after.resetNotify).toBeUndefined();
  expect(after.resetFruit).toBe("apple");
  await expect(page.getByRole("checkbox", { name: "Subscribe" })).not.toBeChecked();
  await expect(page.getByRole("switch", { name: "Notifications" })).not.toBeChecked();
});
