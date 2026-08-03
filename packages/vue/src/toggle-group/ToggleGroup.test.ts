import { render, screen } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { defineComponent, h } from "vue";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { ToggleButton } from "../toggle-button/ToggleButton";
import { ToggleGroup } from "./ToggleGroup";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

const Fixture = defineComponent({
  props: {
    label: { type: String, default: undefined },
    variant: { type: String, default: "separate" },
  },
  setup(props) {
    return () =>
      h(
        ToggleGroup,
        { label: props.label, variant: props.variant as "separate" | "segmented" },
        () => [
          h(ToggleButton, { label: "List" }, () => "List"),
          h(ToggleButton, { label: "Board" }, () => "Board"),
          h(ToggleButton, { label: "Calendar" }, () => "Calendar"),
        ],
      );
  },
});

describe("Vue ToggleGroup (visual wrapper)", () => {
  it("is a role=group carrying the optional container name", () => {
    render(Fixture, { props: { label: "View" } });
    expect(screen.getByRole("group", { name: "View" })).toBeInTheDocument();
  });

  it("renders the inserted toggles, each an independent checkbox", () => {
    render(Fixture);
    expect(screen.getByRole("checkbox", { name: "List" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Board" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Calendar" })).toBeInTheDocument();
  });

  it("toggles each child independently (no shared selection)", async () => {
    const user = userEvent.setup();
    render(Fixture);
    const list = screen.getByRole("checkbox", { name: "List" });
    const board = screen.getByRole("checkbox", { name: "Board" });

    await user.click(list);
    await user.click(board);
    // Both stay on: the group imposes no single-selection.
    expect(list).toBeChecked();
    expect(board).toBeChecked();
  });

  it("carries the variant and orientation as styling hooks", () => {
    render(Fixture, { props: { label: "View", variant: "segmented" } });
    const group = screen.getByRole("group", { name: "View" });
    expect(group).toHaveClass("toggle-group--segmented");
    expect(group).toHaveAttribute("data-orientation", "horizontal");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Fixture, { props: { label: "View" } });
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});
