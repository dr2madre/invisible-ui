import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { ToggleButton } from "../toggle-button/ToggleButton";
import { ToggleGroup, type ToggleGroupProps } from "./ToggleGroup";

const Formatting = (props: Partial<ToggleGroupProps>) => (
  <ToggleGroup label="Formatting" {...props}>
    <ToggleButton label="Bold">B</ToggleButton>
    <ToggleButton label="Italic">I</ToggleButton>
  </ToggleGroup>
);

interface ThreeProps extends Partial<ToggleGroupProps> {
  italicDisabled?: boolean;
  showItalic?: boolean;
  showStrike?: boolean;
}

const Three = ({
  italicDisabled = false,
  showItalic = true,
  showStrike = false,
  ...props
}: ThreeProps) => (
  <ToggleGroup label="Formatting" {...props}>
    <ToggleButton label="Bold">B</ToggleButton>
    {showItalic ? (
      <ToggleButton label="Italic" disabled={italicDisabled}>
        I
      </ToggleButton>
    ) : null}
    <ToggleButton label="Underline">U</ToggleButton>
    {showStrike ? <ToggleButton label="Strike">S</ToggleButton> : null}
  </ToggleGroup>
);

const toggle = (name: string) => screen.getByRole("button", { name });

describe("React ToggleGroup", () => {
  it("is a role=group carrying the optional container name", () => {
    render(<Formatting />);
    const group = screen.getByRole("group", { name: "Formatting" });
    expect(group).toHaveClass("toggle-group", "toggle-group--separate");
    expect(group).toHaveAttribute("data-orientation", "horizontal");
  });

  it("renders the inserted toggles, each an independent toggle button", () => {
    render(<Formatting />);
    expect(screen.getAllByRole("button", { pressed: false })).toHaveLength(2);
  });

  it("toggles each child independently (no shared selection)", async () => {
    const user = userEvent.setup();
    render(<Formatting />);
    await user.click(toggle("Bold"));
    await user.click(toggle("Italic"));
    expect(toggle("Bold")).toHaveAttribute("aria-pressed", "true");
    expect(toggle("Italic")).toHaveAttribute("aria-pressed", "true");
  });

  it("joins the toggles when segmented, and wraps only a separate group", () => {
    const { rerender } = render(<Formatting variant="segmented" wrap orientation="vertical" />);
    const group = screen.getByRole("group", { name: "Formatting" });
    expect(group).toHaveClass("toggle-group--segmented");
    expect(group).not.toHaveClass("toggle-group--wrap");
    expect(group).toHaveAttribute("data-orientation", "vertical");
    rerender(<Formatting wrap />);
    expect(group).toHaveClass("toggle-group--wrap");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Formatting variant="segmented" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("React ToggleGroup keyboard", () => {
  it("leaves one or two toggles as their own tab stops, with no arrow keys", async () => {
    const user = userEvent.setup();
    render(<Formatting />);
    expect(toggle("Bold")).not.toHaveAttribute("tabindex");
    expect(toggle("Italic")).not.toHaveAttribute("tabindex");
    toggle("Bold").focus();
    await user.keyboard("{ArrowRight}");
    expect(toggle("Bold")).toHaveFocus();
    await user.tab();
    expect(toggle("Italic")).toHaveFocus();
  });

  it("makes three toggles one tab stop", () => {
    render(<Three />);
    expect(toggle("Bold")).toHaveAttribute("tabindex", "0");
    expect(toggle("Italic")).toHaveAttribute("tabindex", "-1");
    expect(toggle("Underline")).toHaveAttribute("tabindex", "-1");
  });

  it("moves focus with the arrows, wrapping, and with Home and End", async () => {
    const user = userEvent.setup();
    render(<Three />);
    toggle("Bold").focus();
    await user.keyboard("{ArrowRight}");
    expect(toggle("Italic")).toHaveFocus();
    expect(toggle("Italic")).toHaveAttribute("tabindex", "0");
    expect(toggle("Bold")).toHaveAttribute("tabindex", "-1");
    await user.keyboard("{End}");
    expect(toggle("Underline")).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(toggle("Bold")).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(toggle("Underline")).toHaveFocus();
    await user.keyboard("{Home}");
    expect(toggle("Bold")).toHaveFocus();
  });

  it("does not change any toggle while moving focus", async () => {
    const user = userEvent.setup();
    render(<Three />);
    toggle("Bold").focus();
    await user.keyboard("{ArrowRight}{ArrowRight}{Home}{End}");
    for (const button of screen.getAllByRole("button")) {
      expect(button).toHaveAttribute("aria-pressed", "false");
    }
  });

  it("mirrors Left and Right in right-to-left text", async () => {
    const user = userEvent.setup();
    render(<Three />);
    screen.getByRole("group").setAttribute("dir", "rtl");
    toggle("Bold").focus();
    await user.keyboard("{ArrowLeft}");
    expect(toggle("Italic")).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(toggle("Bold")).toHaveFocus();
  });

  it("uses Up and Down when vertical", async () => {
    const user = userEvent.setup();
    render(<Three orientation="vertical" />);
    toggle("Bold").focus();
    await user.keyboard("{ArrowRight}");
    expect(toggle("Bold")).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(toggle("Italic")).toHaveFocus();
    await user.keyboard("{ArrowUp}");
    expect(toggle("Bold")).toHaveFocus();
  });

  it("skips disabled toggles", async () => {
    const user = userEvent.setup();
    render(<Three italicDisabled />);
    toggle("Bold").focus();
    await user.keyboard("{ArrowRight}");
    expect(toggle("Underline")).toHaveFocus();
  });

  it("returns Tab to the toggle focused last", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Three />
        <button type="button">After</button>
      </>,
    );
    toggle("Bold").focus();
    await user.keyboard("{ArrowRight}");
    await user.tab();
    expect(toggle("After")).toHaveFocus();
    await user.tab({ shift: true });
    expect(toggle("Italic")).toHaveFocus();
  });

  it("moves focus to the neighbour when the focused toggle is removed", async () => {
    const { rerender } = render(<Three />);
    toggle("Italic").focus();
    rerender(<Three showItalic={false} />);
    await waitFor(() => expect(toggle("Underline")).toHaveFocus());
  });

  it("restores each toggle's own tab stop when going down to two", async () => {
    const { rerender } = render(<Three />);
    rerender(<Three showItalic={false} />);
    await waitFor(() => expect(toggle("Bold")).not.toHaveAttribute("tabindex"));
    expect(toggle("Underline")).not.toHaveAttribute("tabindex");
  });

  it("keeps focus where it is when a toggle is added, going up to one tab stop", async () => {
    const { rerender } = render(<Three showItalic={false} />);
    toggle("Underline").focus();
    rerender(<Three showItalic={false} showStrike />);
    await waitFor(() => expect(toggle("Strike")).toHaveAttribute("tabindex", "-1"));
    expect(toggle("Underline")).toHaveFocus();
    expect(toggle("Underline")).toHaveAttribute("tabindex", "0");
    expect(toggle("Bold")).toHaveAttribute("tabindex", "-1");
  });
});
