import "@testing-library/jest-dom/vitest";
import * as matchers from "vitest-axe/matchers";
import { expect, vi } from "vitest";

// Mirrors the other adapters' setup: colour contrast can't be resolved in
// jsdom, so the rule is disabled repo-wide and contrast is covered by the
// token tests instead.
vi.mock("vitest-axe", async (importOriginal) => {
  const actual = await importOriginal<typeof import("vitest-axe")>();

  return {
    ...actual,
    axe: actual.configureAxe({
      rules: {
        "color-contrast": { enabled: false },
        // Page-level rule (landmarks): irrelevant when mounting a single
        // component straight into document.body.
        region: { enabled: false },
      },
    }),
  };
});

expect.extend(matchers);

// jsdom doesn't implement HTMLDialogElement's methods. The dialog family runs
// on the native <dialog> + showModal() (ADR 0005); stub just enough for unit
// tests — real top-layer / inert-background behavior is covered by e2e.
if (typeof HTMLDialogElement !== "undefined" && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
    if (!this.hasAttribute("open")) return;
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
}

// jsdom's canvas API is intentionally incomplete; axe-core may touch it.
if (typeof HTMLCanvasElement !== "undefined") {
  HTMLCanvasElement.prototype.getContext = (() =>
    null) as typeof HTMLCanvasElement.prototype.getContext;
}
