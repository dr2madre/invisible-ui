import { render, screen } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { Tabs } from "./Tabs";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

const items = [
  { value: "account", label: "Account", content: "Account settings." },
  { value: "password", label: "Password", content: "Password settings." },
  { value: "team", label: "Team", content: "Team settings." },
];

describe("Vue Tabs (styled)", () => {
  it("renders a named tab list, tabs, and only the active panel", () => {
    render(Tabs, { props: { items, label: "Settings", value: "account" } });
    expect(screen.getByRole("tablist", { name: "Settings" })).toBeInTheDocument();
    expect(screen.getAllByRole("tab")).toHaveLength(3);
    // Inactive panels are hidden, so excluded from the accessibility tree.
    expect(screen.getAllByRole("tabpanel")).toHaveLength(1);
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Account settings.");

    const account = screen.getByRole("tab", { name: "Account" });
    expect(account).toHaveAttribute("aria-selected", "true");
    expect(account).toHaveAttribute("data-state", "active");
  });

  it("links each tab to its panel and uses roving tabindex", () => {
    render(Tabs, { props: { items, label: "Settings", value: "account" } });
    const [account, password] = screen.getAllByRole("tab");
    const panel = screen.getByRole("tabpanel");

    expect(account).toHaveAttribute("tabindex", "0");
    expect(account).toHaveAttribute("aria-controls", panel.id);
    expect(password).toHaveAttribute("tabindex", "-1");
    expect(panel).toHaveAttribute("aria-labelledby", account.id);
  });

  it("selects a tab on click, swaps the panel and reports the value", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(Tabs, { props: { items, label: "Settings", value: "account", onValueChange } });

    await user.click(screen.getByRole("tab", { name: "Password" }));
    expect(onValueChange).toHaveBeenCalledWith("password");
    expect(screen.getByRole("tab", { name: "Password" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Password settings.");
  });

  it("automatic mode: arrows move focus and select", async () => {
    const user = userEvent.setup();
    render(Tabs, { props: { items, label: "Settings" } });
    const [account, password] = screen.getAllByRole("tab");

    account.focus();
    await user.keyboard("{ArrowRight}");
    expect(password).toHaveFocus();
    expect(password).toHaveAttribute("aria-selected", "true");
  });

  it("manual mode: arrows move focus only; Enter selects", async () => {
    const user = userEvent.setup();
    render(Tabs, { props: { items, label: "Settings", activationMode: "manual" } });
    const [account, password] = screen.getAllByRole("tab");

    account.focus();
    await user.keyboard("{ArrowRight}");
    expect(password).toHaveFocus();
    expect(account).toHaveAttribute("aria-selected", "true"); // not selected yet

    await user.keyboard("{Enter}");
    expect(password).toHaveAttribute("aria-selected", "true");
  });

  it("jumps to first/last with Home/End", async () => {
    const user = userEvent.setup();
    render(Tabs, { props: { items, label: "Settings" } });
    const tabs = screen.getAllByRole("tab");

    tabs[0].focus();
    await user.keyboard("{End}");
    expect(tabs[2]).toHaveFocus();
    await user.keyboard("{Home}");
    expect(tabs[0]).toHaveFocus();
  });

  it("supports v-model: emits update:modelValue on selection", async () => {
    const user = userEvent.setup();
    const { emitted } = render(Tabs, {
      props: { items, label: "Settings", modelValue: "account" },
    });

    await user.click(screen.getByRole("tab", { name: "Team" }));
    expect(emitted("update:modelValue")).toEqual([["team"]]);
  });

  it("updates the active tab when the controlled value changes", async () => {
    const { rerender } = render(Tabs, { props: { items, label: "Settings", value: "account" } });

    await rerender({ value: "team" });
    expect(screen.getByRole("tab", { name: "Team" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Team settings.");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Tabs, { props: { items, label: "Settings", value: "account" } });
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});
