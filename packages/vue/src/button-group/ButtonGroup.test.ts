import { render, screen, within } from "@testing-library/vue";
import { defineComponent, h } from "vue";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { Button } from "../button/Button";
import { ButtonGroup } from "./ButtonGroup";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

const Fixture = defineComponent({
  props: {
    label: { type: String, default: "Text alignment" },
    orientation: { type: String, default: "horizontal" },
    attached: { type: Boolean, default: true },
  },
  setup(props) {
    return () =>
      h(
        ButtonGroup,
        {
          label: props.label,
          orientation: props.orientation as "horizontal" | "vertical",
          attached: props.attached,
        },
        () => [
          h(Button, null, () => "Left"),
          h(Button, null, () => "Center"),
          h(Button, null, () => "Right"),
        ],
      );
  },
});

describe("Vue ButtonGroup (styled)", () => {
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

  it("aligns the items on the cross axis", () => {
    render(Fixture, { props: { label: "Actions" } });
    expect(screen.getByRole("group").getAttribute("style")).toContain("align-items: center");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Fixture);
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});
