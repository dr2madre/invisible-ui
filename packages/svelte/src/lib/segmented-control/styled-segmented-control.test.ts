import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import SegmentedControl from "./SegmentedControl.svelte";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

const items = [
  { value: "list", label: "List" },
  { value: "board", label: "Board" },
  { value: "calendar", label: "Calendar" },
];

describe("Svelte SegmentedControl (styled)", () => {
  it("renders a horizontal, named radio group with the selected segment checked", () => {
    render(SegmentedControl, { props: { items, label: "View", value: "list" } });
    const group = screen.getByRole("radiogroup", { name: "View" });
    expect(group).toHaveAttribute("aria-orientation", "horizontal");
    expect(screen.getByRole("radio", { name: "List" })).toHaveAttribute("data-state", "checked");
  });

  it("selects on click and reports the change", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(SegmentedControl, { props: { items, label: "View", value: "list", onValueChange } });

    await user.click(screen.getByRole("radio", { name: "Board" }));
    expect(screen.getByRole("radio", { name: "Board" })).toHaveAttribute("data-state", "checked");
    expect(onValueChange).toHaveBeenCalledWith("board");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(SegmentedControl, {
      props: { items, label: "View", value: "list" },
    });
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});
