import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { Button } from "../button/Button";
import { ButtonGroup } from "./ButtonGroup";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

const Fixture = (props: Partial<Parameters<typeof ButtonGroup>[0]>) => (
  <ButtonGroup label="Text alignment" {...props}>
    <Button>Left</Button>
    <Button>Center</Button>
    <Button>Right</Button>
  </ButtonGroup>
);

describe("React ButtonGroup (styled)", () => {
  it("renders a labelled, horizontal, attached group around its buttons", () => {
    render(<Fixture />);
    const group = screen.getByRole("group", { name: "Text alignment" });
    expect(group).toHaveAttribute("data-orientation", "horizontal");
    expect(group).not.toHaveAttribute("aria-orientation");
    expect(group).toHaveClass("button-group", "button-group--attached");
    expect(within(group).getAllByRole("button")).toHaveLength(3);
  });

  it("keeps each button an independent tab stop (no roving tabindex)", () => {
    render(<Fixture />);
    for (const button of within(screen.getByRole("group")).getAllByRole("button")) {
      expect(button).not.toHaveAttribute("tabindex");
    }
  });

  it("reflects the vertical orientation, spacing and alignment", () => {
    render(<Fixture orientation="vertical" attached={false} align="end" />);
    const group = screen.getByRole("group");
    expect(group).toHaveAttribute("data-orientation", "vertical");
    expect(group).toHaveClass("button-group--vertical");
    expect(group).not.toHaveClass("button-group--attached");
    expect(group).toHaveStyle({ alignItems: "flex-end" });
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Fixture />);
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});
