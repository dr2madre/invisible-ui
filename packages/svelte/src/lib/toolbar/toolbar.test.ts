import { render, screen, waitFor } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./toolbar.fixture.svelte";
import DynamicFixture from "./toolbar-dynamic.fixture.svelte";
import ToggleFixture from "./toolbar-toggle.fixture.svelte";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

describe("Toolbar", () => {
  it("renders a named toolbar containing its controls", () => {
    render(Fixture);
    const toolbar = screen.getByRole("toolbar", { name: "Text formatting" });
    expect(toolbar).toHaveAttribute("aria-orientation", "horizontal");
    // Toggle buttons are independent on/off controls (native checkboxes).
    expect(screen.getByRole("checkbox", { name: "Bold" })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Align left" })).toBeInTheDocument();
  });

  it("exposes a single tab stop (roving tabindex)", () => {
    render(Fixture);
    expect(screen.getByRole("checkbox", { name: "Bold" })).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("checkbox", { name: "Italic" })).toHaveAttribute("tabindex", "-1");
    expect(screen.getByRole("checkbox", { name: "Align left" })).toHaveAttribute("tabindex", "-1");
  });

  it("moves focus with the arrow keys and wraps, updating the tab stop", async () => {
    const user = userEvent.setup();
    render(Fixture);
    const bold = screen.getByRole("checkbox", { name: "Bold" });
    const italic = screen.getByRole("checkbox", { name: "Italic" });
    const alignLeft = screen.getByRole("checkbox", { name: "Align left" });

    bold.focus();
    await user.keyboard("{ArrowRight}");
    expect(italic).toHaveFocus();
    expect(italic).toHaveAttribute("tabindex", "0");
    expect(bold).toHaveAttribute("tabindex", "-1");

    await user.keyboard("{End}");
    expect(alignLeft).toHaveFocus();
    await user.keyboard("{ArrowRight}"); // wraps to first
    expect(bold).toHaveFocus();
    await user.keyboard("{Home}");
    expect(bold).toHaveFocus();
  });

  it("follows the visual direction in right-to-left text", async () => {
    const user = userEvent.setup();
    const { container } = render(Fixture);
    const toolbar = container.querySelector(".toolbar") as HTMLElement;
    toolbar.setAttribute("dir", "rtl");
    const bold = screen.getByRole("checkbox", { name: "Bold" });
    const italic = screen.getByRole("checkbox", { name: "Italic" });

    bold.focus();
    // The visual start is on the right, so ArrowLeft walks forward.
    await user.keyboard("{ArrowLeft}");
    expect(italic).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(bold).toHaveFocus();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Fixture);
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});

// The roving tab stop must survive DOM changes: children can be added,
// removed, or toggle disabled after mount.
describe("Toolbar (DOM changes)", () => {
  const control = (name: string) => screen.getByRole("button", { name });

  it("keeps a single tab stop when a control is added", async () => {
    const { rerender } = render(DynamicFixture);
    await rerender({ showUnderline: true });

    await waitFor(() => expect(control("Underline")).toHaveAttribute("tabindex", "-1"));
    expect(control("Bold")).toHaveAttribute("tabindex", "0");
  });

  it("moves the tab stop to the first enabled control when its holder is removed", async () => {
    const { rerender } = render(DynamicFixture);
    control("Italic").focus();
    await rerender({ showItalic: false });

    await waitFor(() => expect(control("Bold")).toHaveAttribute("tabindex", "0"));
  });

  it("moves the tab stop off a control that becomes disabled", async () => {
    const { rerender } = render(DynamicFixture);
    control("Italic").focus();
    await rerender({ italicDisabled: true });

    await waitFor(() => expect(control("Bold")).toHaveAttribute("tabindex", "0"));
  });

  it("keeps the last focused control as the tab stop across unrelated changes", async () => {
    const { rerender } = render(DynamicFixture);
    control("Italic").focus();
    await rerender({ showUnderline: true });

    await waitFor(() => expect(control("Underline")).toHaveAttribute("tabindex", "-1"));
    expect(control("Italic")).toHaveAttribute("tabindex", "0");
  });

  it("skips disabled controls with the arrow keys", async () => {
    const user = userEvent.setup();
    render(DynamicFixture, { props: { italicDisabled: true } });

    control("Bold").focus();
    await user.keyboard("{ArrowRight}");
    expect(control("Align left")).toHaveFocus();
  });

  it("enters the Tab order exactly once", async () => {
    const user = userEvent.setup();
    const { rerender } = render(DynamicFixture);
    await rerender({ showUnderline: true });
    await waitFor(() => expect(control("Underline")).toHaveAttribute("tabindex", "-1"));

    await user.tab();
    expect(control("Bold")).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("toolbar").contains(document.activeElement)).toBe(false);
  });
});

// Toggle buttons are the toolbar's usual content, and their disabled prop is
// controlled, so the reconciliation has to see the change they make.
describe("Toolbar (toggle button children)", () => {
  const control = (name: string) => screen.getByRole("checkbox", { name });

  it("moves the tab stop off a toggle button that becomes disabled", async () => {
    const { rerender } = render(ToggleFixture);
    control("Italic").focus();
    expect(control("Italic")).toHaveAttribute("tabindex", "0");

    await rerender({ italicDisabled: true });

    await waitFor(() => expect(control("Bold")).toHaveAttribute("tabindex", "0"));
    expect(control("Italic")).toHaveAttribute("tabindex", "-1");
  });

  it("skips a disabled toggle button with the arrow keys", async () => {
    const user = userEvent.setup();
    render(ToggleFixture, { props: { italicDisabled: true } });

    control("Bold").focus();
    await user.keyboard("{ArrowRight}");
    expect(control("Align left")).toHaveFocus();
  });

  it("takes a re-enabled toggle button back into the arrow-key order", async () => {
    const user = userEvent.setup();
    const { rerender } = render(ToggleFixture, { props: { italicDisabled: true } });
    await rerender({ italicDisabled: false });
    await waitFor(() => expect(control("Italic")).toBeEnabled());

    control("Bold").focus();
    await user.keyboard("{ArrowRight}");
    expect(control("Italic")).toHaveFocus();
  });
});
