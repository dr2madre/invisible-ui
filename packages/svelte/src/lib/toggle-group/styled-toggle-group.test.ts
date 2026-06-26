import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import ToggleGroup from "./ToggleGroup.svelte";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

const items = [
  { value: "list", label: "List" },
  { value: "board", label: "Board" },
  { value: "calendar", label: "Calendar" },
];

describe("Svelte ToggleGroup (styled)", () => {
  it("renders labelled toggles with the initial value pressed", () => {
    render(ToggleGroup, { props: { items, value: ["board"], label: "View" } });
    const board = screen.getByRole("button", { name: "Board" });
    expect(board).toHaveAttribute("aria-pressed", "true");
    expect(board).toHaveAttribute("data-state", "on");
  });

  it("reports the new pressed set on click", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(ToggleGroup, { props: { items, value: ["list"], label: "View", onValueChange } });

    await user.click(screen.getByRole("button", { name: "Calendar" }));
    expect(onValueChange).toHaveBeenCalledWith(["calendar"]);
  });

  it("has no accessibility violations", async () => {
    const { container } = render(ToggleGroup, {
      props: { items, value: ["board"], label: "View" },
    });
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});
