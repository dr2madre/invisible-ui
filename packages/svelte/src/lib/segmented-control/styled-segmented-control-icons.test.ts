import { render, screen, within } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./segmented-control-icons.fixture.svelte";

const group = () => screen.getByRole("radiogroup", { name: "View" });

describe("Svelte SegmentedControl — icon-only", () => {
  it("names each segment from the label via aria-label and hides the visible text", () => {
    render(Fixture);
    const segments = within(group()).getAllByRole("radio");
    expect(segments).toHaveLength(3);
    // Accessible name comes from aria-label…
    expect(within(group()).getByRole("radio", { name: "List" })).toBeInTheDocument();
    expect(within(group()).getByRole("radio", { name: "Board" })).toBeInTheDocument();
    // …while the visible label text is not rendered.
    expect(screen.queryByText("List")).not.toBeInTheDocument();
  });

  it("selects on click and reports the value", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(Fixture, { props: { onValueChange } });

    await user.click(screen.getByRole("radio", { name: "Board" }));
    expect(onValueChange).toHaveBeenLastCalledWith("board");
    expect(screen.getByRole("radio", { name: "Board" })).toBeChecked();
  });

  it("reflects the preselected value", () => {
    render(Fixture, { props: { value: "calendar" } });
    expect(screen.getByRole("radio", { name: "Calendar" })).toBeChecked();
  });

  it("keeps the visible label when iconOnly is false", () => {
    render(Fixture, { props: { iconOnly: false } });
    expect(screen.getByText("List")).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Fixture);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("Svelte SegmentedControl — stacked (mobile bottom-bar)", () => {
  it("shows icon above label (icon precedes label in the DOM) and keeps the label visible", () => {
    render(Fixture, { props: { stacked: true } });
    // The native radio is the control; its <label> is the segment container.
    const segment = screen.getByRole("radio", { name: "List" }).closest(".segment")!;
    // Label stays visible in stacked mode…
    expect(within(segment as HTMLElement).getByText("List")).toBeInTheDocument();
    // …and the icon comes before the label (renders on top in the column).
    const icon = segment.querySelector(".segment__icon");
    const label = segment.querySelector(".segment__label");
    expect(icon).not.toBeNull();
    expect(label).not.toBeNull();
    expect(icon!.compareDocumentPosition(label!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("still selects on click", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(Fixture, { props: { stacked: true, onValueChange } });

    await user.click(screen.getByRole("radio", { name: "Calendar" }));
    expect(onValueChange).toHaveBeenLastCalledWith("calendar");
  });

  it("has no accessibility violations (stacked)", async () => {
    const { container } = render(Fixture, { props: { stacked: true } });
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("Svelte SegmentedControl — vertical (sidebar)", () => {
  it("exposes a vertical radiogroup with the labels visible", () => {
    render(Fixture, { props: { orientation: "vertical", iconOnly: false } });
    expect(group()).toHaveAttribute("aria-orientation", "vertical");
    expect(within(group()).getAllByRole("radio")).toHaveLength(3);
    expect(within(group()).getByText("Board")).toBeInTheDocument();
  });

  it("has no accessibility violations (vertical)", async () => {
    const { container } = render(Fixture, {
      props: { orientation: "vertical", iconOnly: false },
    });
    expect(await axe(container)).toHaveNoViolations();
  });

  it("vertical + icon-only: names via aria-label, hides text", () => {
    render(Fixture, { props: { orientation: "vertical", iconOnly: true } });
    expect(group()).toHaveAttribute("aria-orientation", "vertical");
    expect(within(group()).getByRole("radio", { name: "List" })).toBeInTheDocument();
    expect(screen.queryByText("List")).not.toBeInTheDocument();
  });

  it("vertical + stacked (compact sidebar): keeps labels visible", () => {
    render(Fixture, { props: { orientation: "vertical", stacked: true } });
    expect(group()).toHaveAttribute("aria-orientation", "vertical");
    expect(within(group()).getByText("List")).toBeInTheDocument();
  });
});
