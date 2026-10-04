import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { Icon } from "../icon/Icon";
import { SegmentedControl } from "./SegmentedControl";

const group = () => screen.getByRole("radiogroup", { name: "View" });

const items = [
  { value: "list", label: "List" },
  { value: "board", label: "Board" },
  { value: "calendar", label: "Calendar" },
];
const glyph = (
  <Icon>
    <circle cx="12" cy="12" r="8" />
  </Icon>
);
const iconItems = items.map((item) => ({ ...item, icon: glyph }));

describe("React SegmentedControl (styled)", () => {
  it("renders a horizontal, named radio group with the selected segment checked", () => {
    render(<SegmentedControl items={items} label="View" value="list" />);
    expect(group()).toHaveAttribute("aria-orientation", "horizontal");
    expect(within(group()).getAllByRole("radio")).toHaveLength(3);
    expect(screen.getByRole("radio", { name: "List" })).toHaveAttribute("data-state", "checked");
  });

  it("selects on click and reports the change", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <SegmentedControl items={items} label="View" value="list" onValueChange={onValueChange} />,
    );
    await user.click(screen.getByRole("radio", { name: "Board" }));
    expect(screen.getByRole("radio", { name: "Board" })).toHaveAttribute("data-state", "checked");
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith("board");
  });

  it("moves between segments with the arrow keys", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <SegmentedControl items={items} label="View" value="list" onValueChange={onValueChange} />,
    );
    await user.tab();
    await user.keyboard("{ArrowRight}");
    expect(onValueChange).toHaveBeenLastCalledWith("board");
    expect(screen.getByRole("radio", { name: "Board" })).toHaveFocus();
  });

  it("falls back to the value when no label is given", () => {
    render(<SegmentedControl items={[{ value: "list" }]} label="View" />);
    expect(screen.getByRole("radio", { name: "list" })).toBeInTheDocument();
  });

  it("keeps the group label available to assistive tech when hidden", () => {
    const { container } = render(<SegmentedControl items={items} label="View" hideLabel />);
    expect(group()).toBeInTheDocument();
    expect(container.querySelector(".segmented-field__label--hidden")).toHaveTextContent("View");
  });

  it("is inert when the control is disabled", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<SegmentedControl items={items} label="View" disabled onValueChange={onValueChange} />);
    const segment = screen.getByRole("radio", { name: "List" });
    expect(segment).toBeDisabled();
    await user.click(segment);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("submits the selected value under the field name", async () => {
    const user = userEvent.setup();
    render(
      <form data-testid="form">
        <SegmentedControl items={items} label="View" name="view" value="list" />
      </form>,
    );
    const form = screen.getByTestId("form") as HTMLFormElement;
    expect(new FormData(form).get("view")).toBe("list");
    await user.click(screen.getByRole("radio", { name: "Calendar" }));
    expect(new FormData(form).get("view")).toBe("calendar");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<SegmentedControl items={items} label="View" value="list" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("React SegmentedControl (icon-only)", () => {
  it("names each segment from the label via aria-label and hides the visible text", () => {
    render(<SegmentedControl items={iconItems} label="View" value="list" iconOnly />);
    expect(within(group()).getAllByRole("radio")).toHaveLength(3);
    expect(within(group()).getByRole("radio", { name: "List" })).toBeInTheDocument();
    expect(screen.queryByText("List")).not.toBeInTheDocument();
  });

  it("keeps the visible label when iconOnly is false", () => {
    render(<SegmentedControl items={iconItems} label="View" value="list" />);
    expect(screen.getByText("List")).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <SegmentedControl items={iconItems} label="View" value="list" iconOnly />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("React SegmentedControl (stacked and vertical)", () => {
  it("stacked shows the icon above the label and keeps the label visible", () => {
    render(<SegmentedControl items={iconItems} label="View" value="list" iconOnly stacked />);
    const segment = screen.getByRole("radio", { name: "List" }).closest(".segment")!;
    expect(segment).toHaveClass("segment--stacked");
    const icon = segment.querySelector(".segment__icon")!;
    const label = segment.querySelector(".segment__label")!;
    expect(label).toHaveTextContent("List");
    expect(icon.compareDocumentPosition(label) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("vertical exposes a vertical radiogroup; icon-only names via aria-label", () => {
    render(
      <SegmentedControl
        items={iconItems}
        label="View"
        value="list"
        orientation="vertical"
        iconOnly
      />,
    );
    expect(group()).toHaveAttribute("aria-orientation", "vertical");
    expect(group()).toHaveClass("segmented--vertical");
    expect(within(group()).getByRole("radio", { name: "List" })).toBeInTheDocument();
    expect(screen.queryByText("List")).not.toBeInTheDocument();
  });

  it("has no accessibility violations (vertical)", async () => {
    const { container } = render(
      <SegmentedControl items={iconItems} label="View" value="list" orientation="vertical" />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
