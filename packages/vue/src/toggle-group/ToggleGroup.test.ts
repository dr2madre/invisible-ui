import { render, screen, waitFor } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { defineComponent, h, type PropType } from "vue";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { ToggleButton } from "../toggle-button/ToggleButton";
import { Toolbar } from "../toolbar/Toolbar";
import { ToggleGroup } from "./ToggleGroup";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

const Fixture = defineComponent({
  props: {
    label: { type: String, default: undefined },
    variant: { type: String, default: "separate" },
    orientation: { type: String as PropType<"horizontal" | "vertical">, default: "horizontal" },
    names: { type: Array as PropType<string[]>, default: () => ["List", "Board", "Calendar"] },
    disabled: { type: Array as PropType<string[]>, default: () => [] },
  },
  setup(props) {
    return () =>
      h(
        ToggleGroup,
        {
          label: props.label,
          variant: props.variant as "separate" | "segmented",
          orientation: props.orientation,
        },
        () =>
          props.names.map((name) =>
            h(
              ToggleButton,
              { key: name, label: name, disabled: props.disabled.includes(name) },
              () => name,
            ),
          ),
      );
  },
});

const toggle = (name: string) => screen.getByRole("button", { name });
const tabStops = () =>
  screen.getAllByRole("button").filter((el) => el.getAttribute("tabindex") === "0");

describe("Vue ToggleGroup", () => {
  it("is a role=group carrying the optional container name", () => {
    render(Fixture, { props: { label: "View" } });
    expect(screen.getByRole("group", { name: "View" })).toBeInTheDocument();
  });

  it("renders the inserted toggles, each an independent toggle button", () => {
    render(Fixture);
    for (const name of ["List", "Board", "Calendar"]) {
      expect(screen.getByRole("button", { name, pressed: false })).toBeInTheDocument();
    }
  });

  it("toggles each child independently (no shared selection)", async () => {
    const user = userEvent.setup();
    render(Fixture);

    await user.click(toggle("List"));
    await user.click(toggle("Board"));
    // Both stay on: the group imposes no single-selection.
    expect(screen.getByRole("button", { name: "List", pressed: true })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Board", pressed: true })).toBeInTheDocument();
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

describe("Vue ToggleGroup keyboard", () => {
  it("is one tab stop with three toggles", () => {
    render(Fixture);
    expect(tabStops()).toEqual([toggle("List")]);
    expect(toggle("Board")).toHaveAttribute("tabindex", "-1");
    expect(toggle("Calendar")).toHaveAttribute("tabindex", "-1");
  });

  it("moves with the arrows, wrapping, and Home/End, without pressing", async () => {
    const user = userEvent.setup();
    render(Fixture);
    toggle("List").focus();

    await user.keyboard("{ArrowRight}");
    expect(toggle("Board")).toHaveFocus();
    expect(tabStops()).toEqual([toggle("Board")]);
    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(toggle("List")).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(toggle("Calendar")).toHaveFocus();
    await user.keyboard("{Home}");
    expect(toggle("List")).toHaveFocus();
    await user.keyboard("{End}");
    expect(toggle("Calendar")).toHaveFocus();
    expect(screen.queryAllByRole("button", { pressed: true })).toHaveLength(0);
  });

  it("mirrors Left and Right in right-to-left text", async () => {
    const user = userEvent.setup();
    render(Fixture, { props: { label: "View" } });
    screen.getByRole("group", { name: "View" }).setAttribute("dir", "rtl");
    toggle("List").focus();

    await user.keyboard("{ArrowLeft}");
    expect(toggle("Board")).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(toggle("List")).toHaveFocus();
  });

  it("uses Up and Down when vertical", async () => {
    const user = userEvent.setup();
    render(Fixture, { props: { orientation: "vertical" } });
    toggle("List").focus();

    await user.keyboard("{ArrowRight}");
    expect(toggle("List")).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(toggle("Board")).toHaveFocus();
    await user.keyboard("{ArrowUp}");
    expect(toggle("List")).toHaveFocus();
  });

  it("skips disabled toggles", async () => {
    const user = userEvent.setup();
    render(Fixture, { props: { disabled: ["Board"] } });
    toggle("List").focus();

    await user.keyboard("{ArrowRight}");
    expect(toggle("Calendar")).toHaveFocus();
  });

  it("returns Tab to the toggle focused last", async () => {
    const user = userEvent.setup();
    render(
      defineComponent({
        setup: () => () => [h(Fixture), h("button", { type: "button" }, "After")],
      }),
    );
    await user.tab();
    expect(toggle("List")).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    await user.tab();
    expect(toggle("After")).toHaveFocus();
    await user.tab({ shift: true });
    expect(toggle("Board")).toHaveFocus();
  });

  it("leaves two toggles as their own tab stops, with no arrow keys", async () => {
    const user = userEvent.setup();
    render(Fixture, { props: { names: ["List", "Board"] } });
    expect(toggle("List")).not.toHaveAttribute("tabindex");
    expect(toggle("Board")).not.toHaveAttribute("tabindex");

    toggle("List").focus();
    await user.keyboard("{ArrowRight}");
    expect(toggle("List")).toHaveFocus();
  });

  it("follows the count: 3 to 2 restores each tab stop, 2 to 3 makes one", async () => {
    const { rerender } = render(Fixture);
    await rerender({ names: ["List", "Board"] });
    await waitFor(() => expect(toggle("List")).not.toHaveAttribute("tabindex"));
    expect(toggle("Board")).not.toHaveAttribute("tabindex");

    await rerender({ names: ["List", "Board", "Map"] });
    await waitFor(() => expect(tabStops()).toEqual([toggle("List")]));
  });

  it("moves focus to the neighbour when the focused toggle is removed", async () => {
    const { rerender } = render(Fixture, {
      props: { names: ["List", "Board", "Calendar", "Map"] },
    });
    toggle("Board").focus();
    await rerender({ names: ["List", "Calendar", "Map"] });

    await waitFor(() => expect(toggle("Calendar")).toHaveFocus());
    expect(tabStops()).toEqual([toggle("Calendar")]);
  });

  it("keeps focus where it is when a toggle is added", async () => {
    const { rerender } = render(Fixture);
    toggle("Board").focus();
    await rerender({ names: ["Map", "List", "Board", "Calendar"] });

    await waitFor(() => expect(toggle("Map")).toHaveAttribute("tabindex", "-1"));
    expect(toggle("Board")).toHaveFocus();
    expect(tabStops()).toEqual([toggle("Board")]);
  });

  it("adds nothing inside a toolbar", async () => {
    const user = userEvent.setup();
    render(
      defineComponent({
        setup: () => () =>
          h(Toolbar, { label: "Tools" }, () => [
            h("button", { type: "button" }, "Undo"),
            h(Fixture),
          ]),
      }),
    );
    // The toolbar's single tab stop, not the group's.
    expect(tabStops()).toEqual([toggle("Undo")]);

    toggle("Undo").focus();
    await user.keyboard("{ArrowRight}");
    expect(toggle("List")).toHaveFocus();
    await user.keyboard("{End}");
    expect(toggle("Calendar")).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(toggle("Undo")).toHaveFocus();
    expect(tabStops()).toEqual([toggle("Undo")]);
  });
});
