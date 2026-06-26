import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./segmented-control.fixture.svelte";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

// Built on native radios — arrow-key navigation is browser-owned (jsdom doesn't
// implement it; covered by E2E). These cover rendering, selection and a11y.
describe("Svelte SegmentedControl (native)", () => {
  it("renders a horizontal radiogroup of segments", () => {
    render(Fixture);
    const group = screen.getByRole("radiogroup", { name: "View" });
    expect(group).toHaveAttribute("aria-orientation", "horizontal");
    expect(screen.getAllByRole("radio")).toHaveLength(3);
  });

  it("selects a segment on click", async () => {
    const user = userEvent.setup();
    render(Fixture);
    const board = screen.getByRole("radio", { name: "board" });
    await user.click(board);
    expect(board).toBeChecked();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Fixture, { props: { value: "list" } });
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});
