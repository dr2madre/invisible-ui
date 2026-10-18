import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import "../define";
import type { DsTabs, TabsItem } from "./ds-tabs";

const items: TabsItem[] = [
  { value: "tables", label: "Tables", content: "Table list", count: 11 },
  { value: "columns", label: "Columns", content: "Column list", count: 42 },
  { value: "disabled", label: "Disabled", content: "Unavailable", disabled: true },
];

const mount = (activationMode = "automatic") => {
  document.body.innerHTML = `<ds-tabs label="Catalog" activation-mode="${activationMode}"></ds-tabs>`;
  const tabs = document.querySelector("ds-tabs") as DsTabs;
  tabs.items = items;
  return tabs;
};

describe("<ds-tabs>", () => {
  it("keeps a disabled tab out of the tab sequence", async () => {
    const user = userEvent.setup();
    const tabs = mount();
    tabs.items = [
      { value: "a", label: "A", content: "One" },
      { value: "b", label: "B", content: "Two", disabled: true },
      { value: "c", label: "C", content: "Three" },
    ];
    const disabled = screen.getByRole("tab", { name: "B" });
    expect(disabled).toHaveAttribute("tabindex", "-1");
    expect(disabled).toHaveAttribute("aria-disabled", "true");
    await user.tab();
    expect(screen.getByRole("tab", { name: "A" })).toHaveFocus();
    await user.tab();
    expect(disabled).not.toHaveFocus();
    expect(screen.getByRole("tab", { name: "C" })).not.toHaveFocus();
  });

  it("renders a named tablist, counts and one visible linked panel", () => {
    mount();
    expect(screen.getByRole("tablist", { name: "Catalog" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /^Tables ?\(11\)$/ })).toHaveTextContent("11");
    expect(screen.getAllByRole("tabpanel")).toHaveLength(1);
    const tab = screen.getByRole("tab", { name: /^Tables ?\(11\)$/ });
    const panel = screen.getByRole("tabpanel");
    expect(tab).toHaveAttribute("aria-controls", panel.id);
    expect(panel).toHaveAttribute("aria-labelledby", tab.id);
  });

  it("selects on click, reports once and follows later controlled values", async () => {
    const user = userEvent.setup();
    const host = mount();
    const changes: string[] = [];
    host.addEventListener("change", (event) =>
      changes.push((event as CustomEvent<{ value: string }>).detail.value),
    );

    await user.click(screen.getByRole("tab", { name: /^Columns ?\(42\)$/ }));
    expect(changes).toEqual(["columns"]);
    expect(host.value).toBe("columns");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Column list");

    host.value = "tables";
    expect(changes).toEqual(["columns"]);
    expect(screen.getByRole("tab", { name: /^Tables ?\(11\)$/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("moves and selects with arrows in automatic mode while skipping disabled tabs", async () => {
    const user = userEvent.setup();
    mount();
    const tables = screen.getByRole("tab", { name: /^Tables ?\(11\)$/ });
    const columns = screen.getByRole("tab", { name: /^Columns ?\(42\)$/ });
    tables.focus();
    await user.keyboard("{ArrowRight}");
    expect(columns).toHaveFocus();
    expect(columns).toHaveAttribute("aria-selected", "true");
    await user.keyboard("{ArrowRight}");
    expect(tables).toHaveFocus();
  });

  it("moves without selecting in manual mode and selects with Space", async () => {
    const user = userEvent.setup();
    mount("manual");
    const tables = screen.getByRole("tab", { name: /^Tables ?\(11\)$/ });
    const columns = screen.getByRole("tab", { name: /^Columns ?\(42\)$/ });
    tables.focus();
    await user.keyboard("{ArrowRight}");
    expect(columns).toHaveFocus();
    expect(tables).toHaveAttribute("aria-selected", "true");
    await user.keyboard(" ");
    expect(columns).toHaveAttribute("aria-selected", "true");
  });

  it("replaces item content without losing the public contract", () => {
    const host = mount();
    host.items = [
      { value: "rules", label: "Rules", content: "Rule list", count: 3 },
      { value: "history", label: "History", content: "History list" },
    ];
    expect(screen.getByRole("tab", { name: /^Rules ?\(3\)$/ })).toHaveTextContent("3");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Rule list");
  });

  it("renders rich panels as DOM and strings as text", () => {
    const host = mount();
    host.renderPanel = (item) => {
      if (item.value === "tables") {
        const heading = document.createElement("h2");
        heading.textContent = "Catalog tables";
        return heading;
      }
      return "<strong>not markup</strong>";
    };
    expect(screen.getByRole("heading", { name: "Catalog tables" })).toBeInTheDocument();

    host.value = "columns";
    const panel = screen.getByRole("tabpanel");
    expect(panel).toHaveTextContent("<strong>not markup</strong>");
    expect(panel.querySelector("strong")).toBeNull();
  });

  it("reads the count as part of the tab's name, the badge itself hidden", () => {
    const host = mount();
    const tab = screen.getByRole("tab", { name: /^Tables ?\(11\)$/ });
    expect(tab.querySelector(".tabs__tab-count")).toHaveAttribute("aria-hidden", "true");
    host.items = [
      { value: "inbox", label: "Inbox", icon: "M0 0h24v24H0z", iconOnly: true, count: 3 },
    ];
    expect(screen.getByRole("tab", { name: "Inbox (3)" })).toBeInTheDocument();
  });

  it("writes no empty tablist name and warns once without a label", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const host = mount();
    host.removeAttribute("label");
    const list = screen.getByRole("tablist");
    expect(list).not.toHaveAttribute("aria-label");
    host.setAttribute("activation-mode", "manual");
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]![0]).toMatch(/<ds-tabs> needs a label/);
    host.setAttribute("label", "Catalog");
    expect(list).toHaveAttribute("aria-label", "Catalog");
    warn.mockRestore();
  });

  it("follows the visual direction in right-to-left text", async () => {
    const user = userEvent.setup();
    document.body.innerHTML = `<div dir="rtl"><ds-tabs label="Catalog"></ds-tabs></div>`;
    (document.querySelector("ds-tabs") as DsTabs).items = [
      { value: "one", label: "One" },
      { value: "two", label: "Two" },
      { value: "three", label: "Three" },
    ];
    screen.getByRole("tab", { name: "Two" }).focus();
    // The visual start is on the right, so ArrowLeft walks forward.
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("tab", { name: "Three" })).toHaveFocus();
    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(screen.getByRole("tab", { name: "One" })).toHaveFocus();
  });

  it("has no accessibility violations", async () => {
    mount();
    expect(await axe(document.body)).toHaveNoViolations();
  });
});

describe("<ds-tabs> actions", () => {
  // The pattern of the docs demo: an "Add view" command beside the tab list.
  const mountWithActions = () => {
    document.body.innerHTML = `
      <ds-tabs label="Views">
        <ds-button slot="actions" icon-only aria-label="Add view">+</ds-button>
      </ds-tabs>`;
    const tabs = document.querySelector("ds-tabs") as DsTabs;
    tabs.items = [
      { value: "list", label: "List", content: "List view." },
      { value: "grid", label: "Grid", content: "Grid view." },
    ];
    tabs.querySelector("ds-button")!.addEventListener("click", () => {
      const number = tabs.items.length + 1;
      const value = `view-${number}`;
      tabs.items = [...tabs.items, { value, label: `View ${number}`, content: `View ${number}.` }];
      tabs.value = value;
    });
    return tabs;
  };

  it("renders the action as a button outside the tab list, leaving the tabs alone", () => {
    const tabs = mountWithActions();
    const list = screen.getByRole("tablist", { name: "Views" });
    const add = screen.getByRole("button", { name: "Add view" });
    expect(list).not.toContainElement(add);
    expect(add.closest(".tabs__actions")).not.toBeNull();
    expect(tabs.querySelector(".tabs")).toHaveClass("tabs--with-actions");
    expect(screen.getAllByRole("tab")).toHaveLength(2);
    expect(screen.queryByRole("tab", { name: "Add view" })).toBeNull();
  });

  it("keeps the arrows in the tab list and reaches the action with Tab", async () => {
    const user = userEvent.setup();
    mountWithActions();
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
    mountWithActions();
    const add = screen.getByRole("button", { name: "Add view" });
    await user.click(add);
    await user.click(add);
    expect(screen.getAllByRole("tab")).toHaveLength(4);
    expect(screen.getByRole("tab", { name: "View 4" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("View 4.");
    expect(add).toHaveFocus();
  });

  it("renders no actions area without actions", () => {
    const tabs = mount();
    expect(tabs.querySelector(".tabs__actions")).toBeNull();
    expect(tabs.querySelector(".tabs")).not.toHaveClass("tabs--with-actions");
  });

  it("has no accessibility violations", async () => {
    mountWithActions();
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
