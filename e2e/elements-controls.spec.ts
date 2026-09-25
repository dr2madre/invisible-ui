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

// What the form would submit, as "name=value" pairs in document order.
const formData = (page: Page, testId: string) =>
  page
    .getByTestId(testId)
    .evaluate((form) =>
      [...new FormData(form as HTMLFormElement)].map(([name, value]) =>
        value instanceof File ? `${name}=${value.name}` : `${name}=${value}`,
      ),
    );

test.describe("Elements radio and segmented control", () => {
  test.beforeEach(async ({ page }) => {
    await mount(
      page,
      ["ds-radio", "ds-segmented-control"],
      `<form data-testid="choices">
        <fieldset>
          <legend>Plan</legend>
          <ds-radio name="plan" value="free" checked>Free</ds-radio>
          <ds-radio name="plan" value="pro">Pro</ds-radio>
          <ds-radio name="plan" value="team" disabled>Team</ds-radio>
          <ds-radio name="plan" value="enterprise">Enterprise</ds-radio>
        </fieldset>
        <ds-segmented-control label="View" name="view" value="list">
          <option value="list">List</option>
          <option value="board">Board</option>
          <option value="calendar" disabled>Calendar</option>
          <option value="timeline">Timeline</option>
        </ds-segmented-control>
      </form>`,
    );
  });

  test("native arrow keys move the checked radio and skip the disabled one", async ({ page }) => {
    const free = page.getByRole("radio", { name: "Free" });
    const pro = page.getByRole("radio", { name: "Pro" });
    const enterprise = page.getByRole("radio", { name: "Enterprise" });
    await page
      .locator("ds-radio")
      .first()
      .evaluate((host) => {
        host.parentElement!.addEventListener("change", (event) => {
          const value = (event as CustomEvent<{ value: string }>).detail?.value;
          host.parentElement!.dataset.changes = [host.parentElement!.dataset.changes, value]
            .filter(Boolean)
            .join(" ");
        });
      });

    await free.focus();
    await page.keyboard.press("ArrowDown");
    await expect(pro).toBeChecked();
    await expect(pro).toBeFocused();
    await expect(free).not.toBeChecked();
    await page.keyboard.press("ArrowDown");
    await expect(enterprise).toBeChecked();
    await expect(enterprise).toBeFocused();

    await expect(page.locator("fieldset")).toHaveAttribute("data-changes", "pro enterprise");
    expect(await formData(page, "choices")).toContain("plan=enterprise");
    // The property reads the live input, which the browser changed.
    expect(
      await page
        .locator("ds-radio[value='free']")
        .evaluate((host) => (host as HTMLElement & { checked: boolean }).checked),
    ).toBe(false);
  });

  test("segmented control arrows move the selection, report it and submit it", async ({ page }) => {
    const group = page.getByRole("radiogroup", { name: "View" });
    const list = group.getByRole("radio", { name: "List" });
    const board = group.getByRole("radio", { name: "Board" });
    const timeline = group.getByRole("radio", { name: "Timeline" });
    await page.locator("ds-segmented-control").evaluate((host) => {
      host.addEventListener("change", (event) => {
        host.dataset.changes = [
          host.dataset.changes,
          (event as CustomEvent<{ value: string }>).detail.value,
        ]
          .filter(Boolean)
          .join(" ");
      });
    });

    await expect(list).toBeChecked();
    await list.focus();
    await page.keyboard.press("ArrowRight");
    await expect(board).toBeChecked();
    await expect(board).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expect(timeline).toBeChecked();
    await expect(timeline).toBeFocused();

    const host = page.locator("ds-segmented-control");
    await expect(host).toHaveAttribute("value", "timeline");
    await expect(host).toHaveAttribute("data-changes", "board timeline");
    expect(await formData(page, "choices")).toEqual(["plan=free", "view=timeline"]);

    // The native reset restores the markup's value.
    await page.getByTestId("choices").evaluate((form) => (form as HTMLFormElement).reset());
    await expect(list).toBeChecked();
    expect(await formData(page, "choices")).toEqual(["plan=free", "view=list"]);
  });
});

test.describe("Elements toggle button and toggle group", () => {
  test.beforeEach(async ({ page }) => {
    await mount(
      page,
      ["ds-toggle-button", "ds-toggle-group"],
      `<form data-testid="format">
        <ds-toggle-group label="Formatting" variant="segmented">
          <ds-toggle-button name="bold" label="Bold">B</ds-toggle-button>
          <ds-toggle-button name="italic" label="Italic" pressed>I</ds-toggle-button>
          <ds-toggle-button name="strike" label="Strikethrough" disabled>S</ds-toggle-button>
        </ds-toggle-group>
        <ds-toggle-button name="archived" value="yes" check>Archived</ds-toggle-button>
      </form>`,
    );
  });

  test("Space and a press flip the pressed state, which the form submits", async ({ page }) => {
    const group = page.getByRole("group", { name: "Formatting" });
    const bold = group.getByRole("checkbox", { name: "Bold" });
    const italic = group.getByRole("checkbox", { name: "Italic" });
    const archived = page.getByRole("checkbox", { name: "Archived" });

    await expect(italic).toBeChecked();
    await expect(group.getByRole("checkbox", { name: "Strikethrough" })).toBeDisabled();
    expect(await formData(page, "format")).toEqual(["italic=on"]);

    await bold.focus();
    await page.keyboard.press("Space");
    await expect(bold).toBeChecked();
    await expect(page.locator("ds-toggle-button[name='bold']")).toHaveAttribute("pressed", "");
    await expect(bold).toHaveAttribute("data-state", "on");

    await page.locator("ds-toggle-button[name='italic']").click();
    await expect(italic).not.toBeChecked();
    await expect(page.locator("ds-toggle-button[name='italic']")).not.toHaveAttribute("pressed");

    await page.getByText("Archived").click();
    await expect(archived).toBeChecked();
    // The filter-chip check appears while pressed.
    await expect(page.locator("ds-toggle-button[name='archived'] .toggle__check")).toBeVisible();

    expect(await formData(page, "format")).toEqual(["bold=on", "archived=yes"]);
  });

  test("each toggle in a group stays its own tab stop", async ({ page, browserName }) => {
    test.skip(browserName === "webkit", "Safari tabs to checkboxes only with full keyboard access");
    const group = page.getByRole("group", { name: "Formatting" });
    await group.getByRole("checkbox", { name: "Bold" }).focus();
    await page.keyboard.press("Tab");
    await expect(group.getByRole("checkbox", { name: "Italic" })).toBeFocused();
    // The disabled toggle is skipped.
    await page.keyboard.press("Tab");
    await expect(page.getByRole("checkbox", { name: "Archived" })).toBeFocused();
  });
});

test.describe("Elements upload drop area", () => {
  test.beforeEach(async ({ page }) => {
    await mount(
      page,
      ["ds-upload-drop-area"],
      `<form data-testid="upload">
        <input aria-label="Title" name="title" value="Report" />
        <ds-upload-drop-area name="attachment" multiple caption="PDF or text, up to 5 MB"
          accept=".pdf,.txt"></ds-upload-drop-area>
      </form>`,
    );
    await page.locator("ds-upload-drop-area").evaluate((host) => {
      host.addEventListener("files", (event) => {
        host.dataset.reported = (event as CustomEvent<{ files: File[] }>).detail.files
          .map((file) => file.name)
          .join(",");
      });
    });
  });

  test("the keyboard reaches the file input and picked files join the form", async ({
    page,
    browserName,
  }) => {
    const input = page.locator("ds-upload-drop-area input[type='file']");
    await expect(input).toHaveAccessibleName(/Drag & drop files or browse/);
    await expect(input).toHaveAttribute("accept", ".pdf,.txt");

    if (browserName !== "webkit") {
      // Safari tabs to a file input only with full keyboard access.
      await page.getByRole("textbox", { name: "Title" }).focus();
      await page.keyboard.press("Tab");
      await expect(input).toBeFocused();
    }

    await input.setInputFiles([
      { name: "report.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4") },
      { name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("notes") },
    ]);
    const host = page.locator("ds-upload-drop-area");
    await expect(host).toHaveAttribute("data-reported", "report.pdf,notes.txt");
    expect(
      await host.evaluate((element) =>
        (element as HTMLElement & { files: File[] }).files.map((file) => file.name),
      ),
    ).toEqual(["report.pdf", "notes.txt"]);
    expect(await formData(page, "upload")).toEqual([
      "title=Report",
      "attachment=report.pdf",
      "attachment=notes.txt",
    ]);

    await page.getByTestId("upload").evaluate((form) => (form as HTMLFormElement).reset());
    expect(
      await host.evaluate((element) => (element as HTMLElement & { files: File[] }).files.length),
    ).toBe(0);
  });
});

test.describe("Elements login form", () => {
  test.beforeEach(async ({ page }) => {
    await mount(
      page,
      ["ds-login-form", "ds-text-field", "ds-button"],
      `<ds-login-form heading="Sign in to Catalog" forgot-href="#forgot"></ds-login-form>`,
    );
    await page.locator("ds-login-form").evaluate((host) => {
      host.addEventListener("submit", (event) => {
        const detail = (event as CustomEvent<{ email: string; password: string }>).detail;
        host.dataset.submitted = `${detail.email}|${detail.password}`;
        host.dataset.submits = String(Number(host.dataset.submits ?? 0) + 1);
      });
    });
  });

  test("Enter submits the email and password without leaving the page", async ({ page }) => {
    const url = page.url();
    await expect(page.getByRole("heading", { name: "Sign in to Catalog" })).toBeVisible();
    const email = page.getByRole("textbox", { name: "Email" });
    const password = page.getByLabel("Password", { exact: true });
    await expect(email).toHaveAttribute("type", "email");
    await expect(password).toHaveAttribute("type", "password");

    await email.fill("ada@example.com");
    await password.fill("correct horse");
    await password.press("Enter");

    const host = page.locator("ds-login-form");
    await expect(host).toHaveAttribute("data-submitted", "ada@example.com|correct horse");
    await expect(host).toHaveAttribute("data-submits", "1");
    expect(page.url()).toBe(url);

    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(host).toHaveAttribute("data-submits", "2");
    expect(page.url()).toBe(url);
  });

  test("the native reset clears both fields", async ({ page }) => {
    const email = page.getByRole("textbox", { name: "Email" });
    const password = page.getByLabel("Password", { exact: true });
    await email.fill("ada@example.com");
    await password.fill("secret");

    await page.locator("ds-login-form form").evaluate((form) => (form as HTMLFormElement).reset());
    await expect(email).toHaveValue("");
    await expect(password).toHaveValue("");
    expect(
      await page
        .locator("ds-login-form form")
        .evaluate((form) =>
          [...new FormData(form as HTMLFormElement)].map(([n, v]) => `${n}=${v}`),
        ),
    ).toEqual(["email=", "password="]);
  });
});

test.describe("Elements controls at 320 CSS pixels", () => {
  test.use({ viewport: { width: 320, height: 640 } });

  test("the login form, upload area and segmented control fit the width", async ({ page }) => {
    await mount(
      page,
      ["ds-login-form", "ds-upload-drop-area", "ds-segmented-control", "ds-toggle-group"],
      `<main>
        <ds-login-form></ds-login-form>
        <ds-upload-drop-area caption="PDF or text, up to 5 MB"></ds-upload-drop-area>
        <ds-segmented-control label="View" value="list">
          <option value="list">List</option>
          <option value="board">Board</option>
          <option value="timeline">Timeline</option>
        </ds-segmented-control>
        <ds-toggle-group label="Filters" wrap>
          <ds-toggle-button check>Open</ds-toggle-button>
          <ds-toggle-button check>Assigned to me</ds-toggle-button>
          <ds-toggle-button check>Archived</ds-toggle-button>
        </ds-toggle-group>
      </main>`,
    );
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      320,
    );
    for (const selector of ["ds-login-form form", ".upload-drop-area", ".segmented"]) {
      const box = (await page.locator(selector).boundingBox())!;
      expect(box.x, selector).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width, selector).toBeLessThanOrEqual(320);
    }
  });
});
