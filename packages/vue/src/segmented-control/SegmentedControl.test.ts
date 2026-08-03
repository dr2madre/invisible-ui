import { render, screen, within } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { markRaw } from "vue";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { Icon } from "../icon/Icon";
import { SegmentedControl } from "./SegmentedControl";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

const group = () => screen.getByRole("radiogroup", { name: "View" });

const items = [
  { value: "list", label: "List" },
  { value: "board", label: "Board" },
  { value: "calendar", label: "Calendar" },
];

// `markRaw` keeps the component out of the reactive proxy, as the `icon` prop
// documents.
const iconItems = items.map((item) => ({ ...item, icon: markRaw(Icon) }));

// Built on native radios: arrow-key navigation is browser-owned (jsdom does
// not implement it; E2E covers it). These cover rendering, selection,
// the icon/stacked/vertical layouts and accessibility.
describe("Vue SegmentedControl (styled)", () => {
  it("renders a horizontal, named radio group with the selected segment checked", () => {
    render(SegmentedControl, { props: { items, label: "View", value: "list" } });
    expect(group()).toHaveAttribute("aria-orientation", "horizontal");
    expect(within(group()).getAllByRole("radio")).toHaveLength(3);
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

  it("supports v-model: emits update:modelValue on selection", async () => {
    const user = userEvent.setup();
    const { emitted } = render(SegmentedControl, {
      props: { items, label: "View", modelValue: null },
    });

    await user.click(screen.getByRole("radio", { name: "Calendar" }));
    expect(emitted("update:modelValue")).toEqual([["calendar"]]);
  });

  it("falls back to the value when no label is given", () => {
    render(SegmentedControl, { props: { items: [{ value: "list" }], label: "View" } });
    expect(screen.getByRole("radio", { name: "list" })).toBeInTheDocument();
  });

  it("keeps the group label available to assistive tech when hidden", () => {
    const { container } = render(SegmentedControl, {
      props: { items, label: "View", hideLabel: true },
    });
    expect(group()).toBeInTheDocument();
    expect(container.querySelector(".segmented-field__label--hidden")).not.toBeNull();
  });

  it("is inert when the control is disabled", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(SegmentedControl, { props: { items, label: "View", disabled: true, onValueChange } });

    const segment = screen.getByRole("radio", { name: "List" });
    expect(segment).toBeDisabled();
    await user.click(segment);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(SegmentedControl, {
      props: { items, label: "View", value: "list" },
    });
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});

describe("Vue SegmentedControl (icon-only)", () => {
  it("names each segment from the label via aria-label and hides the visible text", () => {
    render(SegmentedControl, {
      props: { items: iconItems, label: "View", value: "list", iconOnly: true },
    });
    expect(within(group()).getAllByRole("radio")).toHaveLength(3);
    // The accessible name comes from aria-label…
    expect(within(group()).getByRole("radio", { name: "List" })).toBeInTheDocument();
    expect(within(group()).getByRole("radio", { name: "Board" })).toBeInTheDocument();
    // …while the visible label text is left out.
    expect(screen.queryByText("List")).not.toBeInTheDocument();
  });

  it("keeps the visible label when iconOnly is false", () => {
    render(SegmentedControl, { props: { items: iconItems, label: "View", value: "list" } });
    expect(screen.getByText("List")).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(SegmentedControl, {
      props: { items: iconItems, label: "View", value: "list", iconOnly: true },
    });
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});

describe("Vue SegmentedControl (stacked, the mobile bottom-bar look)", () => {
  it("shows the icon above the label and keeps the label visible", () => {
    render(SegmentedControl, {
      props: { items: iconItems, label: "View", value: "list", iconOnly: true, stacked: true },
    });
    // The native radio is the control; its <label> is the segment container.
    const segment = screen.getByRole("radio", { name: "List" }).closest(".segment")!;
    expect(within(segment as HTMLElement).getByText("List")).toBeInTheDocument();

    const icon = segment.querySelector(".segment__icon");
    const label = segment.querySelector(".segment__label");
    expect(icon).not.toBeNull();
    expect(label).not.toBeNull();
    expect(icon!.compareDocumentPosition(label!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("still selects on click", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(SegmentedControl, {
      props: { items: iconItems, label: "View", value: "list", stacked: true, onValueChange },
    });

    await user.click(screen.getByRole("radio", { name: "Calendar" }));
    expect(onValueChange).toHaveBeenLastCalledWith("calendar");
  });
});

describe("Vue SegmentedControl (vertical, the sidebar look)", () => {
  it("exposes a vertical radiogroup with the labels visible", () => {
    render(SegmentedControl, {
      props: { items: iconItems, label: "View", value: "list", orientation: "vertical" },
    });
    expect(group()).toHaveAttribute("aria-orientation", "vertical");
    expect(within(group()).getAllByRole("radio")).toHaveLength(3);
    expect(within(group()).getByText("Board")).toBeInTheDocument();
  });

  it("vertical + icon-only: names via aria-label, leaves the text out", () => {
    render(SegmentedControl, {
      props: {
        items: iconItems,
        label: "View",
        value: "list",
        orientation: "vertical",
        iconOnly: true,
      },
    });
    expect(group()).toHaveAttribute("aria-orientation", "vertical");
    expect(within(group()).getByRole("radio", { name: "List" })).toBeInTheDocument();
    expect(screen.queryByText("List")).not.toBeInTheDocument();
  });

  it("has no accessibility violations (vertical)", async () => {
    const { container } = render(SegmentedControl, {
      props: { items: iconItems, label: "View", value: "list", orientation: "vertical" },
    });
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});
