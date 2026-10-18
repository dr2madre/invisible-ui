import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { Button } from "../button/Button";
import { Tabs, type TabsItem } from "./Tabs";
import { useTabs } from "./use-tabs";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

const items: TabsItem[] = [
  { value: "account", label: "Account", content: "Account settings." },
  { value: "password", label: "Password", content: "Password settings." },
  { value: "team", label: "Team", content: "Team settings." },
];

describe("React Tabs (styled)", () => {
  it("renders a named tab list with the selected tab active, and only its panel", () => {
    render(<Tabs items={items} label="Settings" value="account" />);
    expect(screen.getByRole("tablist", { name: "Settings" })).toBeInTheDocument();
    const account = screen.getByRole("tab", { name: "Account" });
    expect(account).toHaveAttribute("aria-selected", "true");
    expect(account).toHaveAttribute("data-state", "active");
    expect(account).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("tab", { name: "Password" })).toHaveAttribute("tabindex", "-1");
    expect(screen.getAllByRole("tabpanel")).toHaveLength(1);
    const panel = screen.getByRole("tabpanel");
    expect(panel).toHaveTextContent("Account settings.");
    expect(panel).toHaveAttribute("aria-labelledby", account.id);
    expect(account).toHaveAttribute("aria-controls", panel.id);
  });

  it("selects the first enabled tab when no value is given", () => {
    render(<Tabs items={[{ value: "a", disabled: true }, { value: "b" }]} label="Letters" />);
    expect(screen.getByRole("tab", { name: "b" })).toHaveAttribute("aria-selected", "true");
  });

  it("keeps a disabled tab out of the tab sequence", async () => {
    const user = userEvent.setup();
    render(
      <Tabs
        items={[{ value: "a" }, { value: "b", disabled: true }, { value: "c" }]}
        label="Letters"
      />,
    );
    const disabled = screen.getByRole("tab", { name: "b" });
    expect(disabled).toHaveAttribute("tabindex", "-1");
    expect(disabled).toHaveAttribute("aria-disabled", "true");
    await user.tab();
    expect(screen.getByRole("tab", { name: "a" })).toHaveFocus();
    await user.tab();
    expect(disabled).not.toHaveFocus();
    expect(screen.getByRole("tab", { name: "c" })).not.toHaveFocus();
  });

  it("switches on click and reports once", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Tabs items={items} label="Settings" onValueChange={onValueChange} />);
    await user.click(screen.getByRole("tab", { name: "Password" }));
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith("password");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Password settings.");
  });

  it("automatic mode: arrows move focus and select", async () => {
    const user = userEvent.setup();
    render(<Tabs items={items} label="Settings" />);
    screen.getByRole("tab", { name: "Account" }).focus();
    await user.keyboard("{ArrowRight}");
    const password = screen.getByRole("tab", { name: "Password" });
    expect(password).toHaveFocus();
    expect(password).toHaveAttribute("aria-selected", "true");
  });

  it("manual mode: arrows move focus only; Enter selects", async () => {
    const user = userEvent.setup();
    render(<Tabs items={items} label="Settings" activationMode="manual" />);
    screen.getByRole("tab", { name: "Account" }).focus();
    await user.keyboard("{ArrowRight}");
    const password = screen.getByRole("tab", { name: "Password" });
    expect(password).toHaveFocus();
    expect(screen.getByRole("tab", { name: "Account" })).toHaveAttribute("aria-selected", "true");
    await user.keyboard("{Enter}");
    expect(password).toHaveAttribute("aria-selected", "true");
  });

  it("jumps to the first and last tab with Home and End", async () => {
    const user = userEvent.setup();
    render(<Tabs items={items} label="Settings" />);
    screen.getByRole("tab", { name: "Account" }).focus();
    await user.keyboard("{End}");
    expect(screen.getByRole("tab", { name: "Team" })).toHaveFocus();
    await user.keyboard("{Home}");
    expect(screen.getByRole("tab", { name: "Account" })).toHaveFocus();
  });

  it("follows the visual direction in right-to-left text", async () => {
    const user = userEvent.setup();
    render(
      <div dir="rtl">
        <Tabs items={items} label="Settings" />
      </div>,
    );
    screen.getByRole("tab", { name: "Account" }).focus();
    // The visual start is on the right, so ArrowLeft walks forward.
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("tab", { name: "Password" })).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Account" })).toHaveFocus();
  });

  it("reflects a controlled value without reporting it", () => {
    const onValueChange = vi.fn();
    const { rerender } = render(
      <Tabs items={items} label="Settings" value="account" onValueChange={onValueChange} />,
    );
    rerender(<Tabs items={items} label="Settings" value="team" onValueChange={onValueChange} />);
    expect(screen.getByRole("tab", { name: "Team" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Team settings.");
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("calls only the replacement callback after it is swapped", async () => {
    const user = userEvent.setup();
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = render(<Tabs items={items} label="Settings" onValueChange={first} />);
    rerender(<Tabs items={items} label="Settings" onValueChange={second} />);
    await user.click(screen.getByRole("tab", { name: "Team" }));
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith("team");
  });

  it("falls back to the first tab when the selected one leaves the items", () => {
    const { rerender } = render(<Tabs items={items} label="Settings" value="team" />);
    rerender(<Tabs items={items.slice(0, 2)} label="Settings" value="team" />);
    expect(screen.getByRole("tab", { name: "Account" })).toHaveAttribute("aria-selected", "true");
  });

  it("reads the count as part of the tab's name, and hides the badge", () => {
    render(
      <Tabs
        label="Catalog"
        items={[
          { value: "tables", label: "Tables", count: 11 },
          { value: "columns", label: "Columns", count: 42, icon: "M4 4h16", iconOnly: true },
        ]}
      />,
    );
    expect(screen.getByRole("tab", { name: /^Tables ?\(11\)$/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Columns (42)" })).toBeInTheDocument();
    for (const badge of document.querySelectorAll(".tabs__tab-count")) {
      expect(badge).toHaveAttribute("aria-hidden", "true");
    }
  });

  it("renders a panel from renderPanel", () => {
    render(
      <Tabs
        items={items}
        label="Settings"
        renderPanel={(item) => <strong>Rich {item.value}</strong>}
      />,
    );
    expect(screen.getByRole("tabpanel")).toContainHTML("<strong>Rich account</strong>");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Tabs items={items} label="Settings" value="account" />);
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});

function SplitTabs() {
  const { api } = useTabs({ items: [{ value: "form" }, { value: "preview" }] });
  return (
    <>
      <header>
        <div {...api.rootProps} aria-label="Editor">
          <button {...api.getTabProps("form")}>Form</button>
          <button {...api.getTabProps("preview")}>Preview</button>
        </div>
        <button type="button">Close</button>
      </header>
      <div {...api.getPanelProps("form")}>Form panel</div>
      <div {...api.getPanelProps("preview")}>Preview panel</div>
    </>
  );
}

describe("React useTabs", () => {
  it("wires a strip placed apart from its panels", async () => {
    const user = userEvent.setup();
    render(<SplitTabs />);
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Form panel");
    screen.getByRole("tab", { name: "Form" }).focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Preview" })).toHaveFocus();
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Preview panel");
  });
});

// The pattern of the docs demo: an "Add view" command beside the tab list.
function AddViews() {
  const [views, setViews] = useState<TabsItem[]>([
    { value: "list", label: "List", content: "List view." },
    { value: "grid", label: "Grid", content: "Grid view." },
  ]);
  const [view, setView] = useState("list");
  const addView = () => {
    const number = views.length + 1;
    const value = `view-${number}`;
    setViews([...views, { value, label: `View ${number}`, content: `View ${number}.` }]);
    setView(value);
  };
  return (
    <Tabs
      label="Views"
      items={views}
      value={view}
      onValueChange={setView}
      actions={
        <Button iconOnly ariaLabel="Add view" onPress={addView}>
          +
        </Button>
      }
    />
  );
}

describe("React Tabs actions", () => {
  it("renders the action as a button outside the tab list, leaving the tabs alone", () => {
    render(<AddViews />);
    const list = screen.getByRole("tablist", { name: "Views" });
    const add = screen.getByRole("button", { name: "Add view" });
    expect(list).not.toContainElement(add);
    expect(screen.getAllByRole("tab")).toHaveLength(2);
    expect(screen.queryByRole("tab", { name: "Add view" })).toBeNull();
  });

  it("keeps the arrows in the tab list and reaches the action with Tab", async () => {
    const user = userEvent.setup();
    render(<AddViews />);
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
    render(<AddViews />);
    const add = screen.getByRole("button", { name: "Add view" });
    await user.click(add);
    await user.click(add);
    expect(screen.getAllByRole("tab")).toHaveLength(4);
    expect(screen.getByRole("tab", { name: "View 4" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("View 4.");
    expect(add).toHaveFocus();
  });

  it("renders no actions area without actions", () => {
    const { container } = render(<Tabs items={items} label="Settings" />);
    expect(container.querySelector(".tabs__actions")).toBeNull();
    expect(container.firstElementChild).not.toHaveClass("tabs--with-actions");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<AddViews />);
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});
