import { render, screen, waitFor } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { defineComponent, h } from "vue";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { Separator } from "../separator/Separator";
import { ToggleButton } from "../toggle-button/ToggleButton";
import { Toolbar } from "./Toolbar";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

const Fixture = defineComponent({
  props: { orientation: { type: String, default: "horizontal" } },
  setup(props) {
    return () =>
      h(
        Toolbar,
        {
          label: "Text formatting",
          orientation: props.orientation as "horizontal" | "vertical",
        },
        () => [
          h(ToggleButton, { label: "Bold" }, () => "B"),
          h(ToggleButton, { label: "Italic" }, () => "I"),
          h(Separator, { orientation: "vertical", decorative: true }),
          h(ToggleButton, { label: "Align left" }, () => "L"),
        ],
      );
  },
});

const DynamicFixture = defineComponent({
  props: {
    italicDisabled: { type: Boolean, default: false },
    showItalic: { type: Boolean, default: true },
    showUnderline: { type: Boolean, default: false },
  },
  setup(props) {
    return () =>
      h(Toolbar, { label: "Text formatting" }, () => [
        h("button", { type: "button" }, "Bold"),
        props.showItalic
          ? h("button", { type: "button", disabled: props.italicDisabled }, "Italic")
          : null,
        props.showUnderline ? h("button", { type: "button" }, "Underline") : null,
        h("button", { type: "button" }, "Align left"),
      ]);
  },
});

describe("Vue Toolbar", () => {
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
    await user.keyboard("{ArrowRight}"); // wraps to the first control
    expect(bold).toHaveFocus();
    await user.keyboard("{Home}");
    expect(bold).toHaveFocus();
  });

  it("moves along the vertical axis with Up/Down", async () => {
    const user = userEvent.setup();
    render(Fixture, { props: { orientation: "vertical" } });
    const bold = screen.getByRole("checkbox", { name: "Bold" });
    const italic = screen.getByRole("checkbox", { name: "Italic" });

    bold.focus();
    await user.keyboard("{ArrowDown}");
    expect(italic).toHaveFocus();
    await user.keyboard("{ArrowUp}");
    expect(bold).toHaveFocus();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Fixture);
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});

// The roving tab stop must survive DOM changes: children can be added,
// removed, or toggle disabled after mount.
describe("Vue Toolbar (DOM changes)", () => {
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
