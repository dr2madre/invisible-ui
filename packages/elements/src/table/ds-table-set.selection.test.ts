import { screen, within } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { afterEach } from "vitest";
import { axe } from "vitest-axe";
import "../define";
import type { DsTableSet, TableViewDef } from "./ds-table-set";
import type { TableRowId } from "./ds-table-view";
import { listen, mountSet, type MountOptions } from "./table-set.fixture";

afterEach(() => {
  document.body.innerHTML = "";
});

const rowCheckbox = (name: string) =>
  screen.getByRole("checkbox", { name: `Select ${name}` }) as HTMLInputElement;
const selectAll = () =>
  screen.getByRole("checkbox", { name: "Select all visible rows" }) as HTMLInputElement;
const nameSort = () =>
  within(screen.getByRole("columnheader", { name: /Name/ })).getByRole("button");

/** The selection fixture: multiple mode, rows named by `name`. */
const mount = ({ attrs = {}, props = {} }: MountOptions = {}) =>
  mountSet({
    attrs: { "selection-mode": "multiple", ...attrs },
    props: { getRowLabel: (row) => String(row.name), ...props },
  });

/** Feed each reported selection back in, like a controlled consumer. */
const bind = (set: DsTableSet) => {
  set.addEventListener("selected-row-ids-change", (event) => {
    set.selectedRowIds = (
      event as CustomEvent<{ selectedRowIds: TableRowId[] }>
    ).detail.selectedRowIds;
  });
  return set;
};

describe("<ds-table-set> row selection", () => {
  it("renders no selection artifacts in mode none, even with selected ids", () => {
    mount({ attrs: { "selection-mode": "none" }, props: { selectedRowIds: [1, 2] } });
    expect(screen.queryAllByRole("checkbox")).toEqual([]);
    expect(document.querySelector("[data-selected]")).toBeNull();
    expect(screen.getAllByRole("columnheader")).toHaveLength(3);
  });

  it("selects a row: one event, local check, data-selected on the row", async () => {
    const user = userEvent.setup();
    const set = mount();
    const onChange = listen(set, "selected-row-ids-change");
    await user.click(rowCheckbox("Ada"));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({ selectedRowIds: [1] });
    expect(rowCheckbox("Ada")).toBeChecked();
    expect(rowCheckbox("Ada").closest("tr")).toHaveAttribute("data-selected");
    // The checkbox keeps focus while the table re-renders around it.
    expect(rowCheckbox("Ada")).toHaveFocus();
  });

  it("toggles a row from the keyboard without losing focus", async () => {
    const user = userEvent.setup();
    mount();
    rowCheckbox("Grace").focus();
    await user.keyboard(" ");
    expect(rowCheckbox("Grace")).toBeChecked();
    expect(rowCheckbox("Grace")).toHaveFocus();
  });

  it("reflects a controlled selection without any event", () => {
    const set = mount();
    const onChange = listen(set, "selected-row-ids-change");
    set.selectedRowIds = [1, 2];
    expect(rowCheckbox("Ada")).toBeChecked();
    expect(rowCheckbox("Grace")).toBeChecked();
    expect(rowCheckbox("alan")).not.toBeChecked();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("keeps the selection and stays silent across mode changes", async () => {
    const user = userEvent.setup();
    const set = mount({ attrs: { "selection-mode": "none" }, props: { selectedRowIds: [1] } });
    const onChange = listen(set, "selected-row-ids-change");
    expect(screen.queryAllByRole("checkbox")).toEqual([]);
    set.setAttribute("selection-mode", "multiple");
    expect(rowCheckbox("Ada")).toBeChecked();
    set.setAttribute("selection-mode", "single");
    expect(rowCheckbox("Ada")).toBeChecked();
    expect(onChange).not.toHaveBeenCalled();
    // The next user action follows the new mode: single replaces.
    await user.click(rowCheckbox("Grace"));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenLastCalledWith({ selectedRowIds: [2] });
    set.setAttribute("selection-mode", "none");
    expect(screen.queryAllByRole("checkbox")).toEqual([]);
    expect(document.querySelector("[data-selected]")).toBeNull();
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  describe("single mode", () => {
    it("offers no select-all and names the column for screen readers", () => {
      mount({ attrs: { "selection-mode": "single" } });
      expect(screen.queryByRole("checkbox", { name: "Select all visible rows" })).toBeNull();
      expect(screen.getAllByRole("columnheader")[0]).toHaveTextContent("Selection");
    });

    it("replaces the selection and empties it on a re-toggle", async () => {
      const user = userEvent.setup();
      const set = bind(mount({ attrs: { "selection-mode": "single" } }));
      const onChange = listen(set, "selected-row-ids-change");
      await user.click(rowCheckbox("Ada"));
      expect(onChange).toHaveBeenLastCalledWith({ selectedRowIds: [1] });
      await user.click(rowCheckbox("Grace"));
      expect(onChange).toHaveBeenLastCalledWith({ selectedRowIds: [2] });
      await user.click(rowCheckbox("Grace"));
      expect(onChange).toHaveBeenLastCalledWith({ selectedRowIds: [] });
      expect(onChange).toHaveBeenCalledTimes(3);
    });
  });

  describe("select-all over the rendered page", () => {
    it("appends the visible selectable rows and preserves off-page ids", async () => {
      const user = userEvent.setup();
      const set = mount({ attrs: { "page-size": 2 }, props: { selectedRowIds: [2] } });
      const onChange = listen(set, "selected-row-ids-change");
      // Page 1 shows Ada (1) and alan (3); Grace (2) is selected off-page.
      await user.click(selectAll());
      expect(onChange).toHaveBeenLastCalledWith({ selectedRowIds: [2, 1, 3] });
      expect(selectAll()).toBeChecked();
      await user.click(selectAll());
      expect(onChange).toHaveBeenLastCalledWith({ selectedRowIds: [2] });
      expect(onChange).toHaveBeenCalledTimes(2);
    });

    it("shows indeterminate on a partial page and reacts to sorting", async () => {
      const user = userEvent.setup();
      mount({ attrs: { "page-size": 2 }, props: { selectedRowIds: [1] } });
      expect(selectAll().indeterminate).toBe(true);
      // Descending sort brings Grace and Edsger in: nothing selected here.
      await user.click(nameSort());
      expect(selectAll().indeterminate).toBe(false);
      expect(selectAll()).not.toBeChecked();
    });

    it("is disabled when no rendered row is selectable", () => {
      mount({ props: { isRowSelectable: () => false } });
      expect(selectAll()).toBeDisabled();
      expect(screen.getAllByRole("checkbox")).toHaveLength(1);
    });
  });

  describe("non-selectable rows", () => {
    it("renders no checkbox for them and skips them in select-all", async () => {
      const user = userEvent.setup();
      const set = mount({ props: { isRowSelectable: (row) => row.name !== "Ada" } });
      const onChange = listen(set, "selected-row-ids-change");
      expect(screen.queryByRole("checkbox", { name: "Select Ada" })).toBeNull();
      await user.click(selectAll());
      expect(onChange).toHaveBeenLastCalledWith({ selectedRowIds: [3, 5, 4, 2] });
    });

    it("retains selected ids of rows that became non-selectable", () => {
      const set = mount({
        props: { selectedRowIds: [1], isRowSelectable: (row) => row.name !== "Ada" },
      });
      const onChange = listen(set, "selected-row-ids-change");
      expect(screen.queryByRole("checkbox", { name: "Select Ada" })).toBeNull();
      expect(screen.getByText("Ada").closest("tr")).toHaveAttribute("data-selected");
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  it("keeps the selection across sorting and page changes", async () => {
    const user = userEvent.setup();
    bind(mount({ attrs: { "page-size": 2 } }));
    await user.click(rowCheckbox("Ada"));
    await user.click(screen.getByRole("button", { name: "Go to page 2" }));
    expect(screen.queryByRole("checkbox", { name: "Select Ada" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "Go to page 1" }));
    expect(rowCheckbox("Ada")).toBeChecked();
  });

  describe("card view", () => {
    it("renders named checkboxes beside the cards and marks selected items", async () => {
      const user = userEvent.setup();
      mount({ attrs: { view: "card" }, props: { selectedRowIds: [1] } });
      const list = screen.getByRole("list", { name: "People" });
      const adaItem = within(list)
        .getByRole("checkbox", { name: "Select Ada" })
        .closest("[role='listitem']");
      expect(adaItem).toHaveAttribute("data-selected");
      // The select-all control lives outside the list, with a visible label.
      const all = selectAll();
      expect(list.contains(all)).toBe(false);
      expect(all.closest("label")?.querySelector(".field__label")).not.toHaveClass(
        "field__label--hidden",
      );
      await user.click(all);
      expect(within(list).getByRole("checkbox", { name: "Select Grace" })).toBeChecked();
    });
  });

  describe("inside tabbed views", () => {
    const views: TableViewDef[] = [
      {
        id: "people",
        label: "People",
        columns: [
          { key: "name", header: "Name", sortable: true },
          { key: "city", header: "City" },
        ],
        rows: [
          { id: "p1", name: "Ada", city: "London" },
          { id: "p2", name: "Grace", city: "New York" },
        ],
      },
      {
        id: "orders",
        label: "Orders",
        columns: [{ key: "ref", header: "Reference", sortable: true }],
        rows: [{ id: "o1", ref: "A1", name: "A1" }],
      },
    ];

    it("forwards selection into the active view and keeps it across a tab switch", async () => {
      const user = userEvent.setup();
      const set = bind(mount({ props: { views } }));
      const onChange = listen(set, "selected-row-ids-change");
      await user.click(rowCheckbox("Ada"));
      expect(onChange).toHaveBeenLastCalledWith({ selectedRowIds: ["p1"] });
      await user.click(screen.getByRole("tab", { name: "Orders" }));
      expect(rowCheckbox("A1")).not.toBeChecked();
      await user.click(screen.getByRole("tab", { name: "People" }));
      expect(rowCheckbox("Ada")).toBeChecked();
    });
  });

  it("accepts a controlled give-back without churn or events", async () => {
    const user = userEvent.setup();
    const set = bind(mount());
    const onChange = listen(set, "selected-row-ids-change");
    await user.click(rowCheckbox("Ada"));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(rowCheckbox("Ada")).toBeChecked();
    await user.click(rowCheckbox("Grace"));
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenLastCalledWith({ selectedRowIds: [1, 2] });
  });

  it("follows rows through sort, paging and card view with a custom getRowId", async () => {
    const user = userEvent.setup();
    bind(
      mount({
        attrs: { "page-size": 2 },
        props: { getRowId: (row) => `k-${String(row.name)}` },
      }),
    );
    await user.click(rowCheckbox("Ada"));
    await user.click(nameSort());
    expect(screen.queryByRole("checkbox", { name: "Select Ada" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "Go to page 3" }));
    expect(rowCheckbox("Ada")).toBeChecked();
    expect(rowCheckbox("Ada").closest("tr")).toHaveAttribute("data-selected");
  });

  it("has no axe violations with selection enabled", async () => {
    mount({ props: { selectedRowIds: [1] } });
    expect(await axe(document.body)).toHaveNoViolations();
  });
});

// Misuse degrades deterministically: Elements has no development build that
// could throw, so these fallbacks are what every page gets.
describe("<ds-table-set> row selection fallbacks", () => {
  it("renders a row without a stable id as not selectable", () => {
    mount({
      props: {
        rows: [
          { name: "NoId", age: 1, city: "X" },
          { id: 7, name: "Ada", age: 36, city: "London" },
        ],
      },
    });
    expect(rowCheckbox("Ada")).toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: "Select NoId" })).toBeNull();
  });

  it("keeps only the first occurrence of a duplicate id selectable", async () => {
    const user = userEvent.setup();
    mount({
      attrs: { "page-size": 2 },
      props: {
        rows: [
          { id: 1, name: "Ada", age: 36, city: "London" },
          { id: 3, name: "alan", age: 41, city: "London" },
          { id: 1, name: "Grace", age: 85, city: "New York" },
        ],
      },
    });
    expect(rowCheckbox("Ada")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Go to page 2" }));
    expect(screen.getByText("Grace")).toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: "Select Grace" })).toBeNull();
  });

  it("resolves same-page duplicate ids to a single operational control", () => {
    mount({
      props: {
        rows: [
          { id: 1, name: "Ada", age: 36, city: "London" },
          { id: 1, name: "Grace", age: 85, city: "New York" },
          { id: 2, name: "alan", age: 41, city: "London" },
        ],
      },
    });
    expect(rowCheckbox("Ada")).toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: "Select Grace" })).toBeNull();
    expect(rowCheckbox("alan")).toBeInTheDocument();
  });

  it("keeps the controlled selection untouched even with duplicate ids", () => {
    const set = mount({ props: { selectedRowIds: [1, 1] } });
    const onChange = listen(set, "selected-row-ids-change");
    expect(rowCheckbox("Ada")).toBeChecked();
    expect(set.selectedRowIds).toEqual([1, 1]);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("names the checkbox after the row id when the label is invalid", () => {
    mount({ props: { getRowLabel: () => "   " } });
    expect(screen.getByRole("checkbox", { name: "Select 1" })).toBeInTheDocument();
  });
});
