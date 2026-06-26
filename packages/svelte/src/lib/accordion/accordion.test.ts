import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./accordion.fixture.svelte";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

describe("Svelte Accordion", () => {
  it("renders triggers linked to regions, all collapsed", () => {
    render(Fixture);
    const triggers = screen.getAllByRole("button");
    expect(triggers).toHaveLength(3);
    expect(triggers[0]).toHaveAttribute("aria-expanded", "false");
    expect(triggers[0]).toHaveAttribute("aria-controls", "acc-panel-one");
    // Collapsed panels are hidden -> not in the accessibility tree.
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });

  it("expands an item on click and shows its panel", async () => {
    const user = userEvent.setup();
    render(Fixture);
    const one = screen.getByRole("button", { name: "one" });

    await user.click(one);
    expect(one).toHaveAttribute("aria-expanded", "true");
    const panel = screen.getByRole("region");
    expect(panel).toHaveAttribute("aria-labelledby", "acc-trigger-one");
    expect(panel).toHaveTextContent("Panel one");
  });

  it("single: opening one collapses the other", async () => {
    const user = userEvent.setup();
    render(Fixture, { props: { value: ["one"] } });
    await user.click(screen.getByRole("button", { name: "two" }));
    expect(screen.getByRole("button", { name: "one" })).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("button", { name: "two" })).toHaveAttribute("aria-expanded", "true");
  });

  it("multiple: items expand independently", async () => {
    const user = userEvent.setup();
    render(Fixture, { props: { type: "multiple" } });
    await user.click(screen.getByRole("button", { name: "one" }));
    await user.click(screen.getByRole("button", { name: "three" }));
    expect(screen.getAllByRole("region")).toHaveLength(2);
  });

  it("moves focus between headers with arrow keys", async () => {
    const user = userEvent.setup();
    render(Fixture);
    const [one, two] = screen.getAllByRole("button");
    one.focus();
    await user.keyboard("{ArrowDown}");
    expect(two).toHaveFocus();
    await user.keyboard("{Home}");
    expect(one).toHaveFocus();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Fixture, { props: { value: ["one"] } });
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});
