import { fireEvent, screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import "../define";
import type { DsDialog } from "./ds-dialog";

const MARKUP = `
  <ds-dialog heading="Share this file" description="Anyone with the link can view it." trigger="Open dialog">
    <p>Body content</p>
  </ds-dialog>`;

const mount = (html: string = MARKUP) => {
  document.body.innerHTML = html;
  return document.querySelector("ds-dialog") as DsDialog;
};

// Native <dialog>: backdrop presses target the element itself, with
// coordinates outside its box.
const pressBackdrop = (panel: HTMLElement) =>
  fireEvent.pointerDown(panel, { clientX: -10, clientY: -10 });

describe("<ds-dialog>", () => {
  it("is closed by default with the trigger advertising the dialog", () => {
    mount();
    const trigger = screen.getByRole("button", { name: "Open dialog" });
    expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens as a native modal, named and described, focus inside", async () => {
    const user = userEvent.setup();
    mount();
    await user.click(screen.getByRole("button", { name: "Open dialog" }));

    const panel = screen.getByRole("dialog", { name: "Share this file" });
    expect(panel.tagName).toBe("DIALOG");
    expect((panel as HTMLDialogElement).open).toBe(true);
    expect(panel).toHaveAttribute("aria-modal", "true");
    expect(panel).toHaveAccessibleDescription("Anyone with the link can view it.");
    expect(panel).toHaveFocus();
  });

  it("locks body scroll while open and restores it on close", async () => {
    const user = userEvent.setup();
    mount();
    await user.click(screen.getByRole("button", { name: "Open dialog" }));
    expect(document.body.style.overflow).toBe("hidden");

    await user.keyboard("{Escape}");
    expect(document.body.style.overflow).toBe("");
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    mount();
    const trigger = screen.getByRole("button", { name: "Open dialog" });
    await user.click(trigger);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("closes via the close button", async () => {
    const user = userEvent.setup();
    mount();
    await user.click(screen.getByRole("button", { name: "Open dialog" }));
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes on a backdrop press, unless opted out", async () => {
    const user = userEvent.setup();
    const host = mount();
    await user.click(screen.getByRole("button", { name: "Open dialog" }));
    pressBackdrop(screen.getByRole("dialog"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    host.setAttribute("no-outside-close", "");
    await user.click(screen.getByRole("button", { name: "Open dialog" }));
    pressBackdrop(screen.getByRole("dialog"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("is controllable through the open attribute and emits open-change", async () => {
    const user = userEvent.setup();
    const host = mount();
    const onOpenChange = vi.fn();
    host.addEventListener("open-change", (e) => onOpenChange((e as CustomEvent).detail));

    host.open = true;
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledWith({ open: false });
    expect(host.open).toBe(false);
  });

  it("honours initial-focus", async () => {
    const user = userEvent.setup();
    mount(`<ds-dialog heading="Rename" trigger="Open dialog" initial-focus=".target">
      <input class="target" aria-label="New name" />
    </ds-dialog>`);
    await user.click(screen.getByRole("button", { name: "Open dialog" }));
    expect(screen.getByRole("textbox", { name: "New name" })).toHaveFocus();
  });

  it("the trigger attributes drive the button after the first render", () => {
    const host = mount();
    const trigger = screen.getByRole("button", { name: "Open dialog" });

    host.setAttribute("trigger", "Share");
    host.setAttribute("trigger-variant", "primary");

    expect(trigger).toHaveTextContent("Share");
    expect(trigger.dataset.variant).toBe("primary");
  });

  it("the close-label attribute drives the close button after the first render", async () => {
    const user = userEvent.setup();
    const host = mount();
    await user.click(screen.getByRole("button", { name: "Open dialog" }));
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();

    host.setAttribute("close-label", "Dismiss");
    expect(screen.getByRole("button", { name: "Dismiss" })).toBeInTheDocument();
  });

  it("has no accessibility violations when open", async () => {
    const user = userEvent.setup();
    mount();
    await user.click(screen.getByRole("button", { name: "Open dialog" }));
    expect(await axe(document.body)).toHaveNoViolations();
  });
});

// A shared id fallback made every trigger point at whichever dialog mounted
// first, so the second one could never be reached from its own trigger.
describe("two dialogs on one page", () => {
  it("carry distinct ids and resolve their own associations", () => {
    document.body.innerHTML = `
      <ds-dialog heading="First" trigger="Open first"></ds-dialog>
      <ds-dialog heading="Second" trigger="Open second"></ds-dialog>`;

    const hosts = Array.from(document.querySelectorAll("ds-dialog"));
    const panels = hosts.map((host) => host.querySelector("dialog")!);

    expect(panels[0]!.id).not.toBe(panels[1]!.id);
    for (const panel of panels) {
      const titleId = panel.getAttribute("aria-labelledby")!;
      const title = document.getElementById(titleId);
      expect(title, `no title for ${titleId}`).not.toBeNull();
      expect(panel.contains(title)).toBe(true);
    }
  });

  it("open and close independently", async () => {
    const user = userEvent.setup();
    document.body.innerHTML = `
      <ds-dialog heading="First" trigger="Open first"></ds-dialog>
      <ds-dialog heading="Second" trigger="Open second"></ds-dialog>`;

    await user.click(screen.getByRole("button", { name: "Open second" }));

    expect(screen.getByRole("dialog", { name: "Second" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "First" })).toBeNull();
  });
});

// A multi-step workflow is a composition of the dialog's regions. Marked
// light-DOM children become the regions; the rest stays the body.
const WORKFLOW_MARKUP = `
  <ds-dialog heading="Set up project" trigger="Set up project" body-layout="stack" open>
    <span slot="header-meta">Step 2 of 2</span>
    <button slot="footer-lead" type="button">Back</button>
    <button slot="footer" type="button">Create project</button>
    <h3 tabindex="-1">Name the project</h3>
    <label>Project name <input type="text" /></label>
  </ds-dialog>`;

describe("<ds-dialog> workflow composition", () => {
  const panel = () => screen.getByRole("dialog");

  it("renders header metadata before the title, without progress semantics", () => {
    mount(WORKFLOW_MARKUP);
    const meta = panel().querySelector(".dialog__header-meta")!;
    const title = panel().querySelector(".dialog__title")!;

    expect(meta).toHaveTextContent("Step 2 of 2");
    expect(meta.compareDocumentPosition(title) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(meta).not.toHaveAttribute("role");
    expect(meta).not.toHaveAttribute("aria-live");
    expect(panel()).toHaveAccessibleName("Set up project");
  });

  it("keeps one footer action bar, leading actions first in source order", () => {
    mount(WORKFLOW_MARKUP);
    const footers = panel().querySelectorAll("footer");
    expect(footers).toHaveLength(1);

    const buttons = Array.from(footers[0]!.querySelectorAll("button")).map((b) =>
      b.textContent?.trim(),
    );
    expect(buttons).toEqual(["Back", "Create project"]);
    expect(footers[0]!.querySelector(".dialog__footer-lead")).not.toBeNull();
    expect(footers[0]!.querySelector(".dialog__footer-actions")).not.toBeNull();
  });

  it("leaves the unslotted children in the body and strips the marker", () => {
    mount(WORKFLOW_MARKUP);
    const body = panel().querySelector(".dialog__body")!;

    expect(body.querySelector("h3")).not.toBeNull();
    expect(body.querySelector("input")).not.toBeNull();
    // The regions moved out of the body.
    expect(body.querySelector("[slot]")).toBeNull();
    expect(body.textContent).not.toContain("Step 2 of 2");
    expect(body.textContent).not.toContain("Create project");
    // The marker is consumed, so it cannot reach a Shadow DOM that does not exist.
    expect(panel().querySelector("[slot]")).toBeNull();
  });

  it("applies the body layout and follows a later attribute change", () => {
    const element = mount(WORKFLOW_MARKUP);
    const body = panel().querySelector(".dialog__body")!;
    expect(body).toHaveAttribute("data-layout", "stack");

    element.setAttribute("body-layout", "plain");
    expect(body).toHaveAttribute("data-layout", "plain");
  });

  it("keeps the previous behaviour when no child is marked", async () => {
    const user = userEvent.setup();
    mount();
    await user.click(screen.getByRole("button", { name: "Open dialog" }));
    const body = panel().querySelector(".dialog__body")!;

    expect(body).toHaveTextContent("Body content");
    expect(body).toHaveAttribute("data-layout", "plain");
    expect(panel().querySelector("footer")).toBeNull();
    expect(panel().querySelector(".dialog__header-meta")).toBeNull();
  });

  it("has no accessibility violations with the regions in place", async () => {
    mount(WORKFLOW_MARKUP);
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
