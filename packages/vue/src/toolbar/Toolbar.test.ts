import { render, screen } from "@testing-library/vue";
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
