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
