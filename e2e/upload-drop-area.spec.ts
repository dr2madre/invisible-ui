import { expect, test, type Page } from "@playwright/test";
import { VUE_BASE } from "../playwright.config";

// A dropped file must join the form the way a picked one does: today only the
// callback saw it, so the form submitted nothing and a reset had nothing to
// clear. The contract is the native input's: the drop becomes input.files.
const PAGE = "components/forms/upload-drop-area/";

const setup = (page: Page) =>
  page.evaluate(() => {
    const area = document.querySelector(".upload-drop-area") as HTMLElement;
    const input = area.querySelector("input[type=file]") as HTMLInputElement;
    const form = document.createElement("form");
    form.id = "upload-probe-form";
    area.parentElement!.insertBefore(form, area);
    form.append(area);
    input.name = "file";
  });

const drop = (page: Page, names: string[]) =>
  page.evaluate((files) => {
    const area = document.querySelector(".upload-drop-area") as HTMLElement;
    const data = new DataTransfer();
    for (const name of files) data.items.add(new File(["abc"], name, { type: "text/plain" }));
    area.dispatchEvent(
      new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: data }),
    );
  }, names);

const payload = (page: Page) =>
  page.evaluate(() => {
    const form = document.querySelector("#upload-probe-form") as HTMLFormElement;
    return new FormData(form)
      .getAll("file")
      .map((entry) => (entry instanceof File ? entry.name : String(entry)))
      .join(",");
  });

test.beforeEach(async ({ page }) => {
  await page.goto(PAGE);
  await page.waitForLoadState("networkidle");
  await setup(page);
});

test("a dropped file submits, and a reset clears it, like a picked one", async ({ page }) => {
  await drop(page, ["dropped.txt"]);
  expect(await payload(page)).toBe("dropped.txt");

  await page.evaluate(() =>
    (document.querySelector("#upload-probe-form") as HTMLFormElement).reset(),
  );
  expect(await payload(page), "an empty file input submits an empty entry").toBe("");
});

test("a multiple input keeps every dropped file", async ({ page }) => {
  await drop(page, ["one.txt", "two.txt"]);
  expect(await payload(page)).toBe("one.txt,two.txt");
});

// The Vue adapter's own surface, and the single-file case: the harness area
// takes one file, as an input without `multiple` can only hold one.
test("Vue: a dropped file submits, and a single-file input keeps one of many", async ({ page }) => {
  await page.goto(VUE_BASE);
  const area = page.locator(".harness-upload .upload-drop-area");
  await expect(area).toBeVisible();

  const dropInto = (names: string[]) =>
    page.evaluate((files) => {
      const zone = document.querySelector(".harness-upload .upload-drop-area") as HTMLElement;
      const data = new DataTransfer();
      for (const name of files) data.items.add(new File(["abc"], name, { type: "text/plain" }));
      zone.dispatchEvent(
        new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: data }),
      );
    }, names);
  const submitted = () =>
    page.evaluate(() => {
      const form = document.querySelector('[data-testid="upload-form"]') as HTMLFormElement;
      return new FormData(form)
        .getAll("attachment")
        .map((entry) => (entry instanceof File ? entry.name : String(entry)))
        .join(",");
    });

  await dropInto(["only.txt"]);
  expect(await submitted()).toBe("only.txt");
  await expect(page.getByTestId("upload-readout")).toHaveText("Dropped: only.txt");

  await dropInto(["first.txt", "second.txt"]);
  expect(await submitted(), "an input without multiple holds one file").toBe("first.txt");

  await page.evaluate(() =>
    (document.querySelector('[data-testid="upload-form"]') as HTMLFormElement).reset(),
  );
  expect(await submitted()).toBe("");
});
