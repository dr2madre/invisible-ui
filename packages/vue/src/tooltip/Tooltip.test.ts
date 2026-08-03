import { fireEvent, render, screen } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { defineComponent, h } from "vue";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { Tooltip } from "./Tooltip";

// The overlay teleports to document.body, so the axe scan covers the whole
// page; the landmark (region) rule judges the bare fixture's page structure,
// not the component, and is off here.
const noAxeRegion = { rules: { region: { enabled: false } } };

/** Zero delays so tests stay synchronous. */
const Fixture = defineComponent({
  props: {
    text: { type: String, default: "Copy to clipboard" },
  },
  setup(props) {
    return () =>
      h(
        Tooltip,
        { text: props.text, openDelay: 0, closeDelay: 0 },
        { default: () => h("button", { type: "button" }, "Copy") },
      );
  },
});

describe("Vue Tooltip (styled)", () => {
  it("is hidden until the trigger is focused/hovered", () => {
    render(Fixture);
    expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("shows on focus, linking the trigger via aria-describedby, and hides on blur", async () => {
    const { container } = render(Fixture);
    const button = screen.getByRole("button", { name: "Copy" });

    await fireEvent.focusIn(button);
    const tip = await screen.findByRole("tooltip");
    expect(tip).toHaveTextContent("Copy to clipboard");
    const trigger = container.querySelector(".tooltip__trigger")!;
    expect(trigger.getAttribute("aria-describedby")).toBe(tip.id);

    await fireEvent.focusOut(button);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("shows on pointer enter and hides on pointer leave", async () => {
    const { container } = render(Fixture);
    const trigger = container.querySelector<HTMLElement>(".tooltip__trigger")!;

    await fireEvent.pointerEnter(trigger);
    expect(await screen.findByRole("tooltip")).toBeInTheDocument();

    await fireEvent.pointerLeave(trigger);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("is dismissable with Escape", async () => {
    const user = userEvent.setup();
    render(Fixture);
    await fireEvent.focusIn(screen.getByRole("button", { name: "Copy" }));
    expect(await screen.findByRole("tooltip")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("has no accessibility violations when shown", async () => {
    render(Fixture);
    await fireEvent.focusIn(screen.getByRole("button", { name: "Copy" }));
    await screen.findByRole("tooltip");
    expect(await axe(document.body, noAxeRegion)).toHaveNoViolations();
  });
});
