import { fireEvent, screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { afterEach, vi } from "vitest";
import { axe } from "vitest-axe";
import "../define";
import type { DsSheetDialog } from "./ds-sheet-dialog";

afterEach(() => {
  document.body.innerHTML = "";
});

const mount = (extra = "") => {
  document.body.innerHTML = `<ds-sheet-dialog heading="Filters" trigger="Open filters" ${extra}>
    <button slot="header-lead">Back</button>
    <button slot="header-actions">Reset</button>
    <p>Filter controls</p>
    <button slot="footer">Apply</button>
  </ds-sheet-dialog>`;
  return document.querySelector("ds-sheet-dialog") as DsSheetDialog;
};

describe("<ds-sheet-dialog>", () => {
  it("opens as a named native modal anchored to the requested side", async () => {
    const user = userEvent.setup();
    mount('side="left" description="Refine the results."');
    await user.click(screen.getByRole("button", { name: "Open filters" }));
    const panel = screen.getByRole("dialog", { name: "Filters" });
    expect(panel.tagName).toBe("DIALOG");
    expect(panel).toHaveAttribute("data-side", "left");
    expect(panel).toHaveAccessibleDescription("Refine the results.");
    expect(panel).toHaveFocus();
  });

  it("keeps body and named composition regions in source order", async () => {
    const user = userEvent.setup();
    mount();
    await user.click(screen.getByRole("button", { name: "Open filters" }));
    const panel = screen.getByRole("dialog");
    expect(panel.querySelector(".dialog-header__lead")).toHaveTextContent("Back");
    expect(panel.querySelector(".dialog-header__actions")).toHaveTextContent("Reset");
    expect(panel.querySelector(".sheet-dialog__body")).toHaveTextContent("Filter controls");
    expect(panel.querySelector(".sheet-dialog__footer")).toHaveTextContent("Apply");
    expect(panel.querySelector("[slot]")).toBeNull();
  });

  it("does not close from a press inside the panel and closes on the backdrop", async () => {
    const user = userEvent.setup();
    mount();
    await user.click(screen.getByRole("button", { name: "Open filters" }));
    const panel = screen.getByRole("dialog");
    await user.click(screen.getByText("Filter controls"));
    expect(panel).toBeInTheDocument();
    fireEvent.pointerDown(panel, { clientX: -10, clientY: -10 });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("reports one close and restores focus to its trigger", async () => {
    const user = userEvent.setup();
    const host = mount();
    const onOpenChange = vi.fn();
    host.addEventListener("open-change", (event) => onOpenChange((event as CustomEvent).detail));
    const trigger = screen.getByRole("button", { name: "Open filters" });
    await user.click(trigger);
    await user.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledTimes(2);
    expect(onOpenChange).toHaveBeenLastCalledWith({ open: false });
    expect(trigger).toHaveFocus();
  });

  it("supports an external trigger and explicit focus restoration", async () => {
    document.body.innerHTML = `
      <button id="external">Open navigation</button>
      <ds-sheet-dialog heading="Navigation" render-trigger="false" return-focus-to="#external">
        <a href="/home">Home</a>
      </ds-sheet-dialog>`;
    const external = screen.getByRole("button", { name: "Open navigation" });
    const host = document.querySelector("ds-sheet-dialog") as DsSheetDialog;
    external.focus();
    host.open = true;
    expect(screen.getByRole("dialog", { name: "Navigation" })).toBeInTheDocument();
    await userEvent.setup().keyboard("{Escape}");
    expect(external).toHaveFocus();
  });

  it("shows a drag handle only on supported draggable sides", async () => {
    const user = userEvent.setup();
    const host = mount('side="bottom" draggable');
    await user.click(screen.getByRole("button", { name: "Open filters" }));
    const handle = host.querySelector<HTMLElement>(".sheet-dialog__handle")!;
    expect(handle.hidden).toBe(false);
    host.setAttribute("side", "top");
    expect(handle.hidden).toBe(true);
  });

  it("has no accessibility violations when open", async () => {
    const user = userEvent.setup();
    mount();
    await user.click(screen.getByRole("button", { name: "Open filters" }));
    expect(await axe(document.body)).toHaveNoViolations();
  });
});

describe("<ds-sheet-dialog> header", () => {
  it("shows the description as the subtitle inside the shared header", () => {
    document.body.innerHTML = `<ds-sheet-dialog heading="Filters" description="Narrow the list" open></ds-sheet-dialog>`;
    const subtitle = screen.getByText("Narrow the list");
    expect(subtitle).toHaveClass("dialog-header__subtitle");
    expect(subtitle.closest(".dialog-header")).not.toBeNull();
    expect(screen.getByRole("dialog")).toHaveAccessibleDescription("Narrow the list");
  });
});
