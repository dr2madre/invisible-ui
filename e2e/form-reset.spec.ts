import { expect, test, type Page } from "@playwright/test";

// The reset contract (ADR 0012) in a real browser, against a client-only
// render: the docs site is server-rendered elsewhere, and SSR markup carries
// defaults that hide exactly the defects this contract fixes.
const PAGE = "components/patterns/form-reset/";

const demo = (page: Page) => page.getByTestId("library-form");

/** The styled checkbox hides its input; the label is the click target. */
const control = (input: ReturnType<Page["getByRole"]>) => input.locator("xpath=ancestor::label[1]");

const payload = (page: Page, testId: string) =>
  page.evaluate((id) => {
    const form = document.querySelector(`[data-testid="${id}"]`) as HTMLFormElement;
    const data = new FormData(form);
    return Object.fromEntries([...data.keys()].map((key) => [key, data.getAll(key).join(",")]));
  }, testId);

const editLibraryForm = async (page: Page) => {
  const form = demo(page);
  const name = form.getByRole("textbox", { name: "Name" });
  await name.fill("Grace");
  await control(form.getByRole("checkbox", { name: "Subscribe" })).click();
  await control(form.getByRole("switch", { name: "Notifications" })).click();
  await form.getByRole("combobox", { name: "Fruit" }).selectOption("apple");
  const firstCell = form.locator(".pin-input__cell").first();
  await firstCell.click();
  await page.keyboard.press("Backspace");
  await page.keyboard.type("9");
};

test.beforeEach(async ({ page }) => {
  await page.goto(PAGE);
  await expect(demo(page).getByRole("textbox", { name: "Name" })).toBeVisible();
});

test("a reset restores payload and page, reports nothing, and matches native", async ({ page }) => {
  const mounted = await payload(page, "library-form");
  expect(mounted).toEqual({ name: "Ada", subscribe: "on", fruit: "pear", pin: "1234" });

  await editLibraryForm(page);
  const edited = await payload(page, "library-form");
  expect(edited).toEqual({ name: "Grace", notify: "on", fruit: "apple", pin: "9234" });
  const status = page.getByTestId("reset-status");
  const reported = await status.textContent();

  await demo(page).getByRole("button", { name: "Reset the form" }).click();
  // The restore follows the native one by a task; the next frame is past it.
  await page.waitForTimeout(50);
  expect(await payload(page, "library-form")).toEqual(mounted);
  await expect(demo(page).getByRole("textbox", { name: "Name" })).toHaveValue("Ada");
  await expect(demo(page).getByRole("checkbox", { name: "Subscribe" })).toBeChecked();
  await expect(status).toHaveText(
    (reported ?? "").replace(/Reset events seen: \d+/, "Reset events seen: 1"),
  );

  // The native reference answers the same way.
  const nativeMounted = { name: "Ada", subscribe: "on", fruit: "pear" };
  await page.getByTestId("native-form").getByRole("textbox", { name: "Name" }).fill("Grace");
  await page.getByTestId("native-form").getByRole("button", { name: "Reset the form" }).click();
  expect(await payload(page, "native-form")).toEqual(nativeMounted);
});

test("a cancelled reset restores nothing, from the library or the browser", async ({ page }) => {
  await editLibraryForm(page);
  const edited = await payload(page, "library-form");
  await control(demo(page).getByRole("checkbox", { name: "Cancel every reset" })).click();

  await demo(page).getByRole("button", { name: "Reset the form" }).click();
  await page.waitForTimeout(50);
  expect(await payload(page, "library-form")).toEqual(edited);
  await expect(demo(page).getByRole("textbox", { name: "Name" })).toHaveValue("Grace");
});

test("the event precedes the restore, and only a task is past the algorithm", async ({ page }) => {
  await editLibraryForm(page);
  const timing = await page.evaluate(
    () =>
      new Promise<Record<string, string>>((done) => {
        const form = document.querySelector('[data-testid="library-form"]') as HTMLFormElement;
        const name = form.querySelector('input[name="name"]') as HTMLInputElement;
        const seen: Record<string, string> = {};
        form.ownerDocument.addEventListener(
          "reset",
          () => {
            seen.handler = String(new FormData(form).get("name"));
            queueMicrotask(() => {
              seen.microtask = name.value;
            });
            setTimeout(() => {
              seen.task = name.value;
              done(seen);
            }, 20);
          },
          { once: true },
        );
        form.reset();
      }),
  );
  // Inside the handler the payload is the pre-reset one; a task later the
  // restore has run. The microtask row is reported, not asserted: engines
  // agree today, and the task is the only guarantee the contract gives.
  expect(timing.handler).toBe("Grace");
  expect(timing.task).toBe("Ada");
});

test("a later listener's cancellation is honoured on a real click", async ({ page }) => {
  await editLibraryForm(page);
  await page.evaluate(() => {
    // Registered after the library's own document-level listener.
    document.addEventListener("reset", (event) => event.preventDefault(), { once: true });
  });
  await demo(page).getByRole("button", { name: "Reset the form" }).click();
  await page.waitForTimeout(50);
  await expect(demo(page).getByRole("textbox", { name: "Name" })).toHaveValue("Grace");
  expect((await payload(page, "library-form")).name).toBe("Grace");
});
