import { render, screen } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { defineComponent, h, ref } from "vue";
import { Button } from "../button/Button";
import { Tabs, type TabsItem } from "./Tabs";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

const items = [
  { value: "account", label: "Account", content: "Account settings." },
  { value: "password", label: "Password", content: "Password settings." },
  { value: "team", label: "Team", content: "Team settings." },
];

describe("Vue Tabs (styled)", () => {
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
    expect(panel).toHaveAttribute("aria-labelledby", account!.id);
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

    account!.focus();
    await user.keyboard("{ArrowRight}");
    expect(password).toHaveFocus();
    expect(password).toHaveAttribute("aria-selected", "true");
  });

  it("manual mode: arrows move focus only; Enter selects", async () => {
    const user = userEvent.setup();
    render(Tabs, { props: { items, label: "Settings", activationMode: "manual" } });
    const [account, password] = screen.getAllByRole("tab");

    account!.focus();
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

    tabs[0]!.focus();
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

  describe("actions", () => {
    // The pattern of the docs demo: an "Add view" command beside the tab list.
    const AddViews = defineComponent({
      setup() {
        const views = ref<TabsItem[]>([
          { value: "list", label: "List", content: "List view." },
          { value: "grid", label: "Grid", content: "Grid view." },
        ]);
        const view = ref("list");
        const addView = () => {
          const number = views.value.length + 1;
          const value = `view-${number}`;
          views.value = [
            ...views.value,
            { value, label: `View ${number}`, content: `View ${number}.` },
          ];
          view.value = value;
        };
        return () =>
          h(
            Tabs,
            {
              label: "Views",
              items: views.value,
              modelValue: view.value,
              "onUpdate:modelValue": (next: string) => (view.value = next),
            },
            {
              actions: () => [
                h(Button, { iconOnly: true, ariaLabel: "Add view", onPress: addView }, () => "+"),
              ],
            },
          );
      },
    });

    it("renders the action as a button outside the tab list, leaving the tabs alone", () => {
      render(AddViews);
      const list = screen.getByRole("tablist", { name: "Views" });
      const add = screen.getByRole("button", { name: "Add view" });
      expect(list).not.toContainElement(add);
      expect(screen.getAllByRole("tab")).toHaveLength(2);
      expect(screen.queryByRole("tab", { name: "Add view" })).toBeNull();
    });

    it("keeps the arrows in the tab list and reaches the action with Tab", async () => {
      const user = userEvent.setup();
      render(AddViews);
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
      render(AddViews);
      const add = screen.getByRole("button", { name: "Add view" });
      await user.click(add);
      await user.click(add);
      expect(screen.getAllByRole("tab")).toHaveLength(4);
      expect(screen.getByRole("tab", { name: "View 4" })).toHaveAttribute("aria-selected", "true");
      expect(screen.getByRole("tabpanel")).toHaveTextContent("View 4.");
      expect(add).toHaveFocus();
    });

    it("has no accessibility violations", async () => {
      const { container } = render(AddViews);
      expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
    });
  });
});
