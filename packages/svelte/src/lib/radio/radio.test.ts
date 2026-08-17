import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./radio.fixture.svelte";
import CardsFixture from "./radio-cards.fixture.svelte";

describe("Svelte Radio", () => {
  it("renders labelled radios that share a group name", () => {
    render(Fixture, { props: { value: "free" } });
    const free = screen.getByRole("radio", { name: "Free" });
    const pro = screen.getByRole("radio", { name: "Pro" });
    expect(free).toBeChecked();
    expect(pro).not.toBeChecked();
    expect(free).toHaveAttribute("name", "plan");
    expect(pro).toHaveAttribute("name", "plan");
  });

  it("reports the value when a radio is chosen", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(Fixture, { props: { value: "free", onChange } });
    await user.click(screen.getByRole("radio", { name: "Pro" }));
    expect(onChange).toHaveBeenCalledWith("pro");
  });

  it("is selectable by clicking its label", async () => {
    const user = userEvent.setup();
    render(Fixture, { props: { value: "free" } });
    await user.click(screen.getByText("Pro"));
    expect(screen.getByRole("radio", { name: "Pro" })).toBeChecked();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Fixture, { props: { value: "free" } });
    expect(await axe(container)).toHaveNoViolations();
  });
});

// The card presentation from the form-workflow guide. A card is the radio's
// own label, so the choice keeps native radio semantics instead of becoming a
// row of unrelated controls.
describe("Radio cards", () => {
  it("is one named group of radios, with the choice programmatically determinable", () => {
    render(CardsFixture, { props: { value: "new" } });
    const group = screen.getByRole("group", { name: "Where should the project live?" });

    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(2);
    for (const radio of radios) expect(group).toContainElement(radio);
    expect(screen.getByRole("radio", { name: /Create a new folder/ })).toBeChecked();
    expect(screen.getByRole("radio", { name: /Use an existing folder/ })).not.toBeChecked();
  });

  it("selects a card by clicking anywhere in it", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(CardsFixture, { props: { onChange } });

    await user.click(screen.getByText("An empty folder for the project."));
    expect(onChange).toHaveBeenCalledWith("new");
  });

  it("moves the selection with the arrow keys, taking one tab stop", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(CardsFixture, { props: { onChange } });

    await user.tab();
    expect(screen.getByRole("radio", { name: /Use an existing folder/ })).toHaveFocus();

    await user.keyboard("{ArrowDown}");
    expect(onChange).toHaveBeenCalledWith("new");

    // The card holds no other control, so Tab leaves the group.
    await user.tab();
    expect(screen.queryAllByRole("radio").some((radio) => radio === document.activeElement)).toBe(
      false,
    );
  });

  it("marks the selected card with more than colour", () => {
    render(CardsFixture, { props: { value: "new" } });
    const selected = screen.getByRole("radio", { name: /Create a new folder/ }).closest(".card")!;
    const other = screen.getByRole("radio", { name: /Use an existing folder/ }).closest(".card")!;

    // The state is an attribute plus the radio's own checked state, not a colour.
    expect(selected).toHaveAttribute("data-selected");
    expect(other).not.toHaveAttribute("data-selected");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(CardsFixture);
    expect(await axe(container)).toHaveNoViolations();
  });
});
