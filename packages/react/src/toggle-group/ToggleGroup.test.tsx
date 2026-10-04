import { render, screen } from "@testing-library/react";
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

describe("React ToggleGroup (visual wrapper)", () => {
  it("is a role=group carrying the optional container name", () => {
    render(<Formatting />);
    const group = screen.getByRole("group", { name: "Formatting" });
    expect(group).toHaveClass("toggle-group", "toggle-group--separate");
    expect(group).toHaveAttribute("data-orientation", "horizontal");
  });

  it("renders the inserted toggles, each an independent checkbox", () => {
    render(<Formatting />);
    expect(screen.getAllByRole("checkbox")).toHaveLength(2);
  });

  it("toggles each child independently (no shared selection)", async () => {
    const user = userEvent.setup();
    render(<Formatting />);
    await user.click(screen.getByRole("checkbox", { name: "Bold" }));
    await user.click(screen.getByRole("checkbox", { name: "Italic" }));
    expect(screen.getByRole("checkbox", { name: "Bold" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Italic" })).toBeChecked();
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
