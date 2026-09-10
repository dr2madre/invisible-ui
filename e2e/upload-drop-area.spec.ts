import { expect, test, type Page } from "@playwright/test";

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

test("a single-file input keeps one file from a multi-file drop", async ({ page }) => {
  await drop(page, ["one.txt", "two.txt"]);
  expect(await payload(page)).toBe("one.txt");
});
