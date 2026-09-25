import { expect, test } from "@playwright/test";
import { VUE_BASE } from "../playwright.config";

test("Elements Card, Tag and Separator preserve native semantics and keyboard actions", async ({
  page,
}) => {
  await page.goto(VUE_BASE.replace("harness.html", "elements-harness.html"));
  await page.evaluate(async () => {
    await Promise.all([
      customElements.whenDefined("ds-card"),
      customElements.whenDefined("ds-tag"),
      customElements.whenDefined("ds-separator"),
    ]);
    document.body.innerHTML = `
      <ds-card title="Database" description="AdventureWorks" orientation="horizontal"
        surface="secondary" style="--ds-card-secondary-bg: rgb(244, 242, 239)">
        <ds-tag slot="tags" status="success" removable remove-label="Remove status">Connected</ds-tag>
        <p>12 tables available.</p>
        <ds-button slot="actions">Open</ds-button>
      </ds-card>
      <ds-separator></ds-separator>`;
    document.querySelector("ds-tag")?.addEventListener("remove", (event) => {
      (event.currentTarget as HTMLElement).dataset.removeRequested = "true";
    });
  });

  const card = page.getByRole("article", { name: "Database" });
  await expect(card).toBeVisible();
  await expect(card).toContainText("AdventureWorks");
  await expect(card).toContainText("12 tables available.");
  await expect(card).toHaveAttribute("data-surface", "secondary");
  await expect(card).toHaveCSS("background-color", "rgb(244, 242, 239)");
  await expect(page.getByRole("separator")).toHaveAttribute("aria-orientation", "horizontal");

  const remove = card.getByRole("button", { name: "Remove status" });
  await remove.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("ds-tag")).toHaveAttribute("data-remove-requested", "true");
  await expect(page.locator("ds-tag")).toBeVisible();
});

test("Elements Empty State is announced and exposes a keyboard action", async ({ page }) => {
  await page.goto(VUE_BASE.replace("harness.html", "elements-harness.html"));
  await page.evaluate(async () => {
    await customElements.whenDefined("ds-empty-state");
    document.body.innerHTML = `
      <ds-empty-state title="No rules yet" description="Create the first rule."
        action-label="Add rule" size="sm"></ds-empty-state>`;
    document.querySelector("ds-empty-state")?.addEventListener("action", (event) => {
      (event.currentTarget as HTMLElement).dataset.actionRequested = "true";
    });
  });

  const status = page.getByRole("status");
  await expect(status).toBeVisible();
  await expect(status.getByRole("heading", { name: "No rules yet" })).toBeVisible();
  const action = status.getByRole("button", { name: "Add rule" });
  await action.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("ds-empty-state")).toHaveAttribute("data-action-requested", "true");
});

test("Elements Error State is announced and exposes a keyboard recovery action", async ({
  page,
}) => {
  await page.goto(VUE_BASE.replace("harness.html", "elements-harness.html"));
  await page.evaluate(async () => {
    await customElements.whenDefined("ds-error-state");
    document.body.innerHTML = `
      <ds-error-state title="Connection failed" description="Check the server and try again."
        action-label="Try again" size="sm"></ds-error-state>`;
    document.querySelector("ds-error-state")?.addEventListener("action", (event) => {
      (event.currentTarget as HTMLElement).dataset.actionRequested = "true";
    });
  });

  const alert = page.getByRole("alert");
  await expect(alert).toBeVisible();
  await expect(alert.getByRole("heading", { name: "Connection failed" })).toBeVisible();
  const action = alert.getByRole("button", { name: "Try again" });
  await action.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("ds-error-state")).toHaveAttribute("data-action-requested", "true");
});

test("Elements Inline Notification announces feedback and dismisses from the keyboard", async ({
  page,
}) => {
  await page.goto(VUE_BASE.replace("harness.html", "elements-harness.html"));
  await page.evaluate(async () => {
    await customElements.whenDefined("ds-inline-notification");
    document.body.innerHTML = `
      <ds-inline-notification title="Saved" description="Your changes were saved."
        status="success" closable close-label="Dismiss saved message"></ds-inline-notification>`;
    document.querySelector("ds-inline-notification")?.addEventListener("open-change", (event) => {
      const detail = (event as CustomEvent<{ open: boolean }>).detail;
      (event.currentTarget as HTMLElement).dataset.reportedOpen = String(detail.open);
    });
  });

  const notification = page.getByRole("status", { name: "Saved" });
  await expect(notification).toContainText("Your changes were saved.");
  const close = notification.getByRole("button", { name: "Dismiss saved message" });
  const box = await close.boundingBox();
  expect(box?.width).toBeGreaterThanOrEqual(24);
  expect(box?.height).toBeGreaterThanOrEqual(24);
  await close.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("ds-inline-notification")).toHaveAttribute(
    "data-reported-open",
    "false",
  );
  await expect(page.locator(".inline-notification")).toHaveCount(0);
});

test("Elements Loading exposes determinate progress and live status semantics", async ({
  page,
}) => {
  await page.goto(VUE_BASE.replace("harness.html", "elements-harness.html"));
  await page.evaluate(async () => {
    await customElements.whenDefined("ds-loading");
    document.body.innerHTML = `
      <ds-loading variant="bar" value="48" label="Importing files" show-value
        detail="3 of 8 files"></ds-loading>`;
  });

  const progress = page.getByRole("progressbar", { name: "Importing files" });
  await expect(progress).toHaveAttribute("aria-valuenow", "48");
  await expect(progress).toHaveAttribute("aria-valuetext", "3 of 8 files");
  await expect(progress.locator(".loading__fill")).toHaveCSS("inline-size", /.+/);
  await page.locator("ds-loading").evaluate((host) => {
    host.removeAttribute("value");
    host.setAttribute("variant", "spinner");
    host.setAttribute("status", "Connecting…");
  });
  await expect(page.getByRole("status")).toContainText("Connecting…");
  await expect(page.getByRole("status")).toHaveAttribute("aria-atomic", "true");
});

test("Elements Loading Generation Area replaces its placeholder with completed content", async ({
  page,
}) => {
  await page.goto(VUE_BASE.replace("harness.html", "elements-harness.html"));
  await page.evaluate(async () => {
    await customElements.whenDefined("ds-loading-generation-area");
    document.body.innerHTML = `
      <ds-loading-generation-area status="Rendering" value="40" detail="3 of 8 files"
        label-position="bottom">
        <span slot="indicator">Custom indicator</span>
        <p>Generated result</p>
      </ds-loading-generation-area>`;
  });

  const host = page.locator("ds-loading-generation-area");
  const status = page.getByRole("status");
  await expect(status).toBeVisible();
  await expect(status).toContainText("Rendering");
  await expect(status).toContainText("40%");
  await expect(status).toContainText("Custom indicator");
  await expect(status).toHaveAttribute("data-position", "bottom");
  await expect(page.getByText("Generated result")).toHaveCount(0);

  await host.evaluate((element) => element.setAttribute("loading", "false"));
  await expect(status).toHaveCount(0);
  await expect(page.getByText("Generated result")).toBeVisible();
});

test("Elements Sheet Dialog stays open for inside presses and restores focus", async ({ page }) => {
  await page.goto(VUE_BASE.replace("harness.html", "elements-harness.html"));
  await page.evaluate(async () => {
    await customElements.whenDefined("ds-sheet-dialog");
    document.body.innerHTML = `
      <ds-sheet-dialog heading="Filters" description="Refine the results."
        trigger="Open filters" side="right">
        <button slot="header-actions" type="button">Reset</button>
        <label>Query <input /></label>
        <button slot="footer" type="button">Apply</button>
      </ds-sheet-dialog>`;
  });

  const trigger = page.getByRole("button", { name: "Open filters" });
  await trigger.click();
  const panel = page.getByRole("dialog", { name: "Filters" });
  await expect(panel).toBeVisible();
  await expect(panel).toHaveAccessibleDescription("Refine the results.");
  await expect(panel).toHaveAttribute("data-side", "right");
  await panel.getByRole("button", { name: "Reset" }).click();
  await expect(panel).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(panel).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("Elements Tree View expands, selects and navigates from the keyboard", async ({ page }) => {
  await page.goto(VUE_BASE.replace("harness.html", "elements-harness.html"));
  await page.evaluate(async () => {
    await customElements.whenDefined("ds-tree-view");
    const tree = document.createElement("ds-tree-view") as HTMLElement & {
      nodes: unknown[];
      expanded: string[];
    };
    tree.setAttribute("label", "Project files");
    tree.nodes = [
      { value: "src", children: [{ value: "index.ts" }, { value: "button.ts" }] },
      { value: "package.json" },
    ];
    tree.expanded = ["src"];
    document.body.appendChild(tree);
  });

  const tree = page.getByRole("tree", { name: "Project files" });
  const src = tree.getByRole("treeitem", { name: /src/ });
  await src.focus();
  await page.keyboard.press("ArrowDown");
  const index = tree.getByRole("treeitem", { name: /index\.ts/ });
  await expect(index).toBeFocused();
  await page.keyboard.press("Space");
  await expect(index).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("ArrowLeft");
  await expect(src).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await expect(src).toHaveAttribute("aria-expanded", "false");
  await expect(tree.getByRole("treeitem", { name: /index\.ts/ })).toHaveCount(0);
});

test("Elements Tree View loads remote children without losing focus and retries failures", async ({
  page,
}) => {
  await page.goto(VUE_BASE.replace("harness.html", "elements-harness.html"));
  await page.evaluate(async () => {
    await customElements.whenDefined("ds-tree-view");
    const tree = document.createElement("ds-tree-view") as HTMLElement & {
      nodes: Array<{ value: string; hasChildren?: boolean; children?: unknown[] }>;
      expanded: string[];
      loading: string[];
      loadErrors: string[];
    };
    tree.setAttribute("label", "Database catalog");
    tree.nodes = [
      { value: "production", hasChildren: true },
      { value: "archive", hasChildren: true },
    ];
    tree.expanded = [];
    const attempts = new Map<string, number>();
    const latest = new Map<string, number>();
    tree.addEventListener("load-children", (event) => {
      const { value, requestId } = (event as CustomEvent).detail;
      latest.set(value, requestId);
      const attempt = (attempts.get(value) ?? 0) + 1;
      attempts.set(value, attempt);
      tree.loading = [...new Set([...tree.loading, value])];
      tree.loadErrors = tree.loadErrors.filter((entry) => entry !== value);
      window.setTimeout(() => {
        if (latest.get(value) !== requestId) return;
        tree.loading = tree.loading.filter((entry) => entry !== value);
        if (value === "archive" && attempt === 1) {
          tree.loadErrors = [...tree.loadErrors, value];
          return;
        }
        tree.nodes = tree.nodes.map((node) =>
          node.value === value ? { ...node, children: [{ value: `${value}-child` }] } : node,
        );
      }, 150);
    });
    document.body.appendChild(tree);
  });

  const tree = page.getByRole("tree", { name: "Database catalog" });
  const production = tree.getByRole("treeitem", { name: "production", exact: true });
  await production.focus();
  await page.keyboard.press("ArrowRight");
  await expect(production).toHaveAttribute("aria-busy", "true");
  await expect(production).toBeFocused();
  await expect(tree.getByRole("treeitem", { name: /production-child/ })).toBeVisible();
  await expect(production).toBeFocused();

  const archive = tree.getByRole("treeitem", { name: "archive", exact: true });
  await archive.focus();
  await page.keyboard.press("ArrowRight");
  await expect(archive).toHaveAttribute("data-load-state", "error");
  await expect(archive).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(archive).toHaveAttribute("aria-busy", "true");
  await expect(tree.getByRole("treeitem", { name: /archive-child/ })).toBeVisible();
  await expect(archive).toBeFocused();
});

test("Elements ghost Button takes the text colour inside a dialog, like every other variant", async ({
  page,
}) => {
  await page.goto(VUE_BASE.replace("harness.html", "elements-harness.html"));
  await page.evaluate(async () => {
    await customElements.whenDefined("ds-button");
    document.body.innerHTML = `
      <dialog open><ds-button variant="ghost">Cancel</ds-button></dialog>
      <span data-probe style="color: var(--ds-color-text)">probe</span>`;
  });

  const ghost = page.getByRole("button", { name: "Cancel" });
  const probe = page.locator("[data-probe]");
  const expected = await probe.evaluate((node) => getComputedStyle(node).color);
  await expect(ghost).toHaveCSS("color", expected);
  expect(expected).not.toBe("rgb(0, 0, 0)");
});
