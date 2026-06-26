import { render, screen, within } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./button-group.fixture.svelte";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

describe("Svelte ButtonGroup (styled)", () => {
  it("renders a labelled, horizontal group around its buttons", () => {
    render(Fixture);
    const group = screen.getByRole("group", { name: "Text alignment" });
    expect(group).toHaveAttribute("data-orientation", "horizontal");
    expect(within(group).getAllByRole("button")).toHaveLength(3);
  });

  it("keeps each button an independent tab stop (no roving tabindex)", () => {
    render(Fixture);
    const group = screen.getByRole("group", { name: "Text alignment" });
    for (const button of within(group).getAllByRole("button")) {
      expect(button).not.toHaveAttribute("tabindex");
    }
  });

  it("reflects the vertical orientation as a styling hook", () => {
    render(Fixture, { props: { orientation: "vertical" } });
    expect(screen.getByRole("group")).toHaveAttribute("data-orientation", "vertical");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Fixture);
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});
