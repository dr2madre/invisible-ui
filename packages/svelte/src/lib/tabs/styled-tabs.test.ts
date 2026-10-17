import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import Tabs from "./Tabs.svelte";
import TabsActionsFixture from "./tabs-actions.fixture.svelte";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

const items = [
  { value: "account", label: "Account", content: "Account settings." },
  { value: "password", label: "Password", content: "Password settings." },
  { value: "team", label: "Team", content: "Team settings." },
];

describe("Svelte Tabs (styled)", () => {
  it("keeps a disabled tab out of the tab sequence", async () => {
    const user = userEvent.setup();
    render(Tabs, {
      props: {
        items: [{ value: "a" }, { value: "b", disabled: true }, { value: "c" }],
        label: "Letters",
      },
    });
    const disabled = screen.getByRole("tab", { name: "b" });
    expect(disabled).toHaveAttribute("tabindex", "-1");
    expect(disabled).toHaveAttribute("aria-disabled", "true");
    await user.tab();
    expect(screen.getByRole("tab", { name: "a" })).toHaveFocus();
    await user.tab();
    expect(disabled).not.toHaveFocus();
    expect(screen.getByRole("tab", { name: "c" })).not.toHaveFocus();
  });

  it("renders a named tab list with the selected tab active", () => {
    render(Tabs, { props: { items, label: "Settings", value: "account" } });
    expect(screen.getByRole("tablist", { name: "Settings" })).toBeInTheDocument();

    const account = screen.getByRole("tab", { name: "Account" });
    expect(account).toHaveAttribute("aria-selected", "true");
    expect(account).toHaveAttribute("data-state", "active");
  });

  it("shows only the selected panel and switches on click", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(Tabs, { props: { items, label: "Settings", value: "account", onValueChange } });

    expect(screen.getByRole("tabpanel")).toHaveTextContent("Account settings.");

    await user.click(screen.getByRole("tab", { name: "Password" }));
    expect(onValueChange).toHaveBeenCalledWith("password");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Password settings.");
  });

  it("updates the active tab when the controlled value changes", async () => {
    const { rerender } = render(Tabs, {
      props: { items, label: "Settings", value: "account" },
    });

    await rerender({ items, label: "Settings", value: "team" });
    expect(screen.getByRole("tab", { name: "Team" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Team settings.");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Tabs, {
      props: { items, label: "Settings", value: "account" },
    });
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });

  describe("actions", () => {
    it("renders the action as a button outside the tab list, leaving the tabs alone", () => {
      render(TabsActionsFixture);
      const list = screen.getByRole("tablist", { name: "Views" });
      const add = screen.getByRole("button", { name: "Add view" });
      expect(list).not.toContainElement(add);
      expect(screen.getAllByRole("tab")).toHaveLength(2);
      expect(screen.queryByRole("tab", { name: "Add view" })).toBeNull();
    });

    it("keeps the arrows in the tab list and reaches the action with Tab", async () => {
      const user = userEvent.setup();
      render(TabsActionsFixture);
      await user.tab();
      expect(screen.getByRole("tab", { name: "List" })).toHaveFocus();
      await user.keyboard("{ArrowRight}");
      expect(screen.getByRole("tab", { name: "Grid" })).toHaveFocus();
      await user.keyboard("{ArrowRight}");
      expect(screen.getByRole("tab", { name: "List" })).toHaveFocus();
      await user.tab();
      expect(screen.getByRole("button", { name: "Add view" })).toHaveFocus();
    });

    it("adds and selects a tab per press, keeping focus on the action", async () => {
      const user = userEvent.setup();
      render(TabsActionsFixture);
      const add = screen.getByRole("button", { name: "Add view" });
      await user.click(add);
      await user.click(add);
      expect(screen.getAllByRole("tab")).toHaveLength(4);
      const added = screen.getByRole("tab", { name: "View 4" });
      expect(added).toHaveAttribute("aria-selected", "true");
      expect(screen.getByRole("tabpanel")).toHaveTextContent("View 4.");
      expect(add).toHaveFocus();
      expect(add).not.toHaveAttribute("role");
    });

    it("has no accessibility violations", async () => {
      const { container } = render(TabsActionsFixture);
      expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
    });
  });
});
