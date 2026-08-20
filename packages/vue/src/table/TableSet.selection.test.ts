import { render, screen, within } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { TableSet, type TableViewDef } from "./TableSet";
import type { TableColumnDef, TableRow } from "./Table";

const columns: TableColumnDef[] = [
  { key: "name", header: "Name", sortable: true, hideable: false },
  { key: "age", header: "Age", sortable: true, align: "end" },
  { key: "city", header: "City" },
];

const rows: TableRow[] = [
  { id: 1, name: "Ada", age: 36, city: "London" },
  { id: 2, name: "Grace", age: 85, city: "New York" },
  { id: 3, name: "alan", age: 41, city: "London" },
  { id: 4, name: "Edsger", age: 60, city: "Rotterdam" },
  { id: 5, name: "Barbara", age: 80, city: "Boston" },
];

const getRowLabel = (row: TableRow) => String(row.name);

const setup = (props: Record<string, unknown> = {}) =>
  render(TableSet, {
    props: {
      columns,
      rows,
      title: "People",
      caption: "People",
      selectionMode: "multiple",
      getRowLabel,
      ...props,
    },
  });

const rowCheckbox = (name: string) =>
  screen.getByRole("checkbox", { name: `Select ${name}` }) as HTMLInputElement;

const selectAll = () =>
  screen.getByRole("checkbox", { name: "Select all visible rows" }) as HTMLInputElement;

describe("Vue TableSet — row selection", () => {
  it("renders no selection artifacts in mode none, even with selected ids", () => {
    setup({ selectionMode: "none", selectedRowIds: [1, 2] });
    expect(screen.queryAllByRole("checkbox")).toEqual([]);
    expect(document.querySelector("[data-selected]")).toBeNull();
    // Only the three data columns; no leading selection column.
    expect(screen.getAllByRole("columnheader")).toHaveLength(3);
  });

  it("selects a row: one callback, local check, data-selected on the row", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    setup({ onSelectedRowIdsChange: onChange });
    await user.click(rowCheckbox("Ada"));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith([1]);
    expect(rowCheckbox("Ada")).toBeChecked();
    expect(rowCheckbox("Ada").closest("tr")).toHaveAttribute("data-selected");
  });

  it("reflects a controlled selection without any callback", async () => {
    const onChange = vi.fn();
    const { rerender } = setup({ onSelectedRowIdsChange: onChange });
    await rerender({ selectedRowIds: [1, 2] });
    expect(rowCheckbox("Ada")).toBeChecked();
    expect(rowCheckbox("Grace")).toBeChecked();
    expect(rowCheckbox("alan")).not.toBeChecked();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("keeps the selection and stays silent across mode changes", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = setup({
      selectionMode: "none",
      selectedRowIds: [1],
      onSelectedRowIdsChange: onChange,
    });
    expect(screen.queryAllByRole("checkbox")).toEqual([]);
    // none -> multiple: the column appears and the controlled ids render.
    await rerender({ selectionMode: "multiple" });
    expect(rowCheckbox("Ada")).toBeChecked();
    // multiple -> single: the selection is preserved as it is.
    await rerender({ selectionMode: "single" });
    expect(rowCheckbox("Ada")).toBeChecked();
    expect(onChange).not.toHaveBeenCalled();
    // The next user action follows the new mode: single replaces.
    await user.click(rowCheckbox("Grace"));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenLastCalledWith([2]);
    // single -> none: column and data-selected disappear, nothing is emitted.
    await rerender({ selectionMode: "none" });
    expect(screen.queryAllByRole("checkbox")).toEqual([]);
    expect(document.querySelector("[data-selected]")).toBeNull();
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  describe("single mode", () => {
    it("offers no select-all and names the column for screen readers", () => {
      setup({ selectionMode: "single" });
      expect(
        screen.queryByRole("checkbox", { name: "Select all visible rows" }),
      ).not.toBeInTheDocument();
      expect(screen.getAllByRole("columnheader")[0]).toHaveTextContent("Selection");
    });

    it("replaces the selection and empties it on a re-toggle", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      setup({ selectionMode: "single", onSelectedRowIdsChange: onChange });
      await user.click(rowCheckbox("Ada"));
      expect(onChange).toHaveBeenLastCalledWith([1]);
      await user.click(rowCheckbox("Grace"));
      expect(onChange).toHaveBeenLastCalledWith([2]);
      // Re-toggling the selected row returns the selection to zero.
      await user.click(rowCheckbox("Grace"));
      expect(onChange).toHaveBeenLastCalledWith([]);
      expect(onChange).toHaveBeenCalledTimes(3);
    });
  });

  describe("select-all over the rendered page", () => {
    it("appends the visible selectable rows and preserves off-page ids", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      setup({ pageSize: 2, selectedRowIds: [2], onSelectedRowIdsChange: onChange });
      // Page 1 shows Ada (1) and alan (3); Grace (2) is selected off-page.
      await user.click(selectAll());
      expect(onChange).toHaveBeenLastCalledWith([2, 1, 3]);
      expect(selectAll()).toBeChecked();
      // A second activation removes only the page's rows.
      await user.click(selectAll());
      expect(onChange).toHaveBeenLastCalledWith([2]);
      expect(onChange).toHaveBeenCalledTimes(2);
    });

    it("shows indeterminate on a partial page and reacts to sorting", async () => {
      const user = userEvent.setup();
      setup({ pageSize: 2, selectedRowIds: [1] });
      // Ada is selected on the page beside the unselected alan.
      expect(selectAll().indeterminate).toBe(true);
      // Descending sort brings Grace and Edsger in: nothing selected here.
      const nameButton = within(screen.getByRole("columnheader", { name: /Name/ })).getByRole(
        "button",
      );
      await user.click(nameButton);
      expect(selectAll().indeterminate).toBe(false);
      expect(selectAll()).not.toBeChecked();
    });

    it("is disabled when no rendered row is selectable", () => {
      setup({ isRowSelectable: () => false });
      expect(selectAll()).toBeDisabled();
      expect(screen.getAllByRole("checkbox")).toHaveLength(1);
    });
  });

  describe("non-selectable rows", () => {
    it("renders no checkbox for them and skips them in select-all", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      setup({
        isRowSelectable: (row: TableRow) => row.name !== "Ada",
        onSelectedRowIdsChange: onChange,
      });
      expect(screen.queryByRole("checkbox", { name: "Select Ada" })).not.toBeInTheDocument();
      await user.click(selectAll());
      expect(onChange).toHaveBeenLastCalledWith([3, 5, 4, 2]);
    });

    it("retains selected ids of rows that became non-selectable", () => {
      const onChange = vi.fn();
      setup({
        selectedRowIds: [1],
        isRowSelectable: (row: TableRow) => row.name !== "Ada",
        onSelectedRowIdsChange: onChange,
      });
      // Ada keeps her selected state, loses only the control.
      expect(screen.queryByRole("checkbox", { name: "Select Ada" })).not.toBeInTheDocument();
      const adaRow = screen.getByText("Ada").closest("tr");
      expect(adaRow).toHaveAttribute("data-selected");
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  it("keeps the selection across sorting and page changes", async () => {
    const user = userEvent.setup();
    setup({ pageSize: 2 });
    await user.click(rowCheckbox("Ada"));
    // Page 2 (Barbara, Edsger), then back: Ada is still selected.
    await user.click(screen.getByRole("button", { name: "Go to page 2" }));
    expect(screen.queryByRole("checkbox", { name: "Select Ada" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Go to page 1" }));
    expect(rowCheckbox("Ada")).toBeChecked();
  });

  describe("card view", () => {
    it("renders named checkboxes beside the cards and marks selected items", async () => {
      const user = userEvent.setup();
      setup({ view: "card", selectedRowIds: [1] });
      const list = screen.getByRole("list", { name: "People" });
      const adaItem = within(list)
        .getByRole("checkbox", { name: "Select Ada" })
        .closest("[role='listitem']");
      expect(adaItem).toHaveAttribute("data-selected");
      // The select-all control lives outside the list, with a visible label.
      const all = selectAll();
      expect(list.contains(all)).toBe(false);
      expect(screen.getByText("Select all visible rows")).toBeVisible();
      await user.click(all);
      expect(within(list).getByRole("checkbox", { name: "Select Grace" })).toBeChecked();
    });
  });

  describe("development failures", () => {
    it("throws on a row without a stable id", () => {
      expect(() => setup({ rows: [{ name: "NoId", age: 1, city: "X" }] })).toThrow(
        /\[ds\] Row selection needs a stable id/,
      );
    });

    it("throws on a duplicate row id", () => {
      expect(() =>
        setup({
          rows: [
            { id: 1, name: "Ada", age: 36, city: "London" },
            { id: 1, name: "Grace", age: 85, city: "New York" },
          ],
        }),
      ).toThrow(/\[ds\] Duplicate row id "1"/);
    });

    it("throws when getRowLabel yields nothing or only spaces", () => {
      const nullish = (() => undefined) as unknown as () => string;
      expect(() => setup({ getRowLabel: nullish })).toThrow(
        /\[ds\] Row selection needs `getRowLabel`/,
      );
      expect(() => setup({ getRowLabel: () => "   " })).toThrow(
        /\[ds\] Row selection needs `getRowLabel`/,
      );
    });

    it("accepts the same rows while selection is off", () => {
      expect(() =>
        setup({ selectionMode: "none", rows: [{ name: "NoId", age: 1, city: "X" }] }),
      ).not.toThrow();
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
      const onChange = vi.fn();
      // A controlled harness: the callback value feeds the prop back in.
      const { rerender } = setup({ views, selectedRowIds: [], onSelectedRowIdsChange: onChange });
      await user.click(rowCheckbox("Ada"));
      expect(onChange).toHaveBeenLastCalledWith(["p1"]);
      await rerender({ selectedRowIds: ["p1"] });
      await user.click(screen.getByRole("tab", { name: "Orders" }));
      // The shared selection holds no id of this view's rows.
      expect(rowCheckbox("A1")).not.toBeChecked();
      await user.click(screen.getByRole("tab", { name: "People" }));
      expect(rowCheckbox("Ada")).toBeChecked();
    });
  });

  it("calls only the replacement callback after the prop is swapped", async () => {
    const user = userEvent.setup();
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = setup({ onSelectedRowIdsChange: first });
    await rerender({ onSelectedRowIdsChange: second });
    await user.click(rowCheckbox("Ada"));
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("accepts a controlled give-back without churn or callbacks", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = setup({ selectedRowIds: [], onSelectedRowIdsChange: onChange });
    await user.click(rowCheckbox("Ada"));
    expect(onChange).toHaveBeenCalledTimes(1);
    // The parent gives the emitted value back as a fresh array: the mirror
    // must recognize the same content and stay quiet.
    await rerender({ selectedRowIds: [1] });
    expect(rowCheckbox("Ada")).toBeChecked();
    await user.click(rowCheckbox("Grace"));
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenLastCalledWith([1, 2]);
  });

  it("throws on a controlled selection that carries duplicate ids", () => {
    expect(() => setup({ selectedRowIds: [1, 1] })).toThrow(
      /\[ds\] `selectedRowIds` must not contain duplicate ids/,
    );
  });

  it("follows rows through sort, paging and card view with a custom getRowId", async () => {
    const user = userEvent.setup();
    let selected: unknown[] = [];
    const getRowId = (row: TableRow) => `k-${String(row.name)}`;
    const { rerender } = setup({
      pageSize: 2,
      getRowId,
      selectedRowIds: selected,
      onSelectedRowIdsChange: (ids: unknown[]) => (selected = ids),
    });
    await user.click(rowCheckbox("Ada"));
    await rerender({ selectedRowIds: selected });
    // Descending sort moves Ada off the page; her id is retained.
    const nameButton = within(screen.getByRole("columnheader", { name: /Name/ })).getByRole(
      "button",
    );
    await user.click(nameButton);
    expect(screen.queryByRole("checkbox", { name: "Select Ada" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Go to page 3" }));
    expect(rowCheckbox("Ada")).toBeChecked();
    expect(rowCheckbox("Ada").closest("tr")).toHaveAttribute("data-selected");
  });

  it("has no axe violations with selection enabled", async () => {
    const { container } = setup({ selectedRowIds: [1] });
    expect(
      await axe(container, { rules: { "color-contrast": { enabled: false } } }),
    ).toHaveNoViolations();
  });
});
