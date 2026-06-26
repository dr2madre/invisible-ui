import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./tabs.fixture.svelte";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

describe("Svelte Tabs", () => {
  it("renders a tablist, tabs, and only the active panel", () => {
    render(Fixture);
    expect(screen.getByRole("tablist", { name: "Sections" })).toBeInTheDocument();
    expect(screen.getAllByRole("tab")).toHaveLength(3);
    // Inactive panels are hidden, so excluded from the accessibility tree.
    expect(screen.getAllByRole("tabpanel")).toHaveLength(1);
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Panel one");
  });

  it("links each tab to its panel and uses roving tabindex", () => {
    render(Fixture);
    const [one, two] = screen.getAllByRole("tab");
    expect(one).toHaveAttribute("aria-selected", "true");
    expect(one).toHaveAttribute("tabindex", "0");
    expect(one).toHaveAttribute("aria-controls", "t-panel-one");
    expect(two).toHaveAttribute("tabindex", "-1");

    const panel = screen.getByRole("tabpanel");
    expect(panel).toHaveAttribute("aria-labelledby", "t-tab-one");
  });

  it("selects a tab on click and swaps the visible panel", async () => {
    const user = userEvent.setup();
    render(Fixture);
    await user.click(screen.getByRole("tab", { name: "two" }));
    expect(screen.getByRole("tab", { name: "two" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Panel two");
  });

  it("automatic mode: arrows move focus and select", async () => {
    const user = userEvent.setup();
    render(Fixture);
    const [one, two] = screen.getAllByRole("tab");

    one.focus();
    await user.keyboard("{ArrowRight}");
    expect(two).toHaveFocus();
    expect(two).toHaveAttribute("aria-selected", "true");
  });

  it("manual mode: arrows move focus only; Enter selects", async () => {
    const user = userEvent.setup();
    render(Fixture, { props: { activationMode: "manual" } });
    const [one, two] = screen.getAllByRole("tab");

    one.focus();
    await user.keyboard("{ArrowRight}");
    expect(two).toHaveFocus();
    expect(one).toHaveAttribute("aria-selected", "true"); // not selected yet

    await user.keyboard("{Enter}");
    expect(two).toHaveAttribute("aria-selected", "true");
  });

  it("jumps to first/last with Home/End", async () => {
    const user = userEvent.setup();
    render(Fixture);
    const tabs = screen.getAllByRole("tab");

    tabs[0].focus();
    await user.keyboard("{End}");
    expect(tabs[2]).toHaveFocus();
    await user.keyboard("{Home}");
    expect(tabs[0]).toHaveFocus();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Fixture);
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});
