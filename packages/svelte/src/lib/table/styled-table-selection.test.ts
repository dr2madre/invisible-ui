import { fireEvent, render, screen, within } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import type { TableViewDef } from "./TableSet.svelte";
import Fixture from "./table-selection.fixture.svelte";

const rowCheckbox = (name: string) =>
  screen.getByRole("checkbox", { name: `Select ${name}` }) as HTMLInputElement;

const selectAll = () =>
  screen.getByRole("checkbox", { name: "Select all visible rows" }) as HTMLInputElement;

describe("Svelte TableSet — row selection", () => {
  it("renders no selection artifacts in mode none, even with selected ids", () => {
    render(Fixture, { props: { selectionMode: "none", selectedRowIds: [1, 2] } });
    expect(screen.queryAllByRole("checkbox")).toEqual([]);
    expect(document.querySelector("[data-selected]")).toBeNull();
    // Only the three data columns; no leading selection column.
    expect(screen.getAllByRole("columnheader")).toHaveLength(3);
  });

  it("selects a row: one callback, local check, data-selected on the row", async () => {
    const onChange = vi.fn();
    render(Fixture, { props: { onSelectedRowIdsChange: onChange } });
    await fireEvent.click(rowCheckbox("Ada"));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith([1]);
    expect(rowCheckbox("Ada")).toBeChecked();
    expect(rowCheckbox("Ada").closest("tr")).toHaveAttribute("data-selected");
  });

  it("reflects a controlled selection without any callback", async () => {
    const onChange = vi.fn();
    const { rerender } = render(Fixture, { props: { onSelectedRowIdsChange: onChange } });
    await rerender({ selectedRowIds: [1, 2] });
    expect(rowCheckbox("Ada")).toBeChecked();
    expect(rowCheckbox("Grace")).toBeChecked();
    expect(rowCheckbox("alan")).not.toBeChecked();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("keeps the selection and stays silent across mode changes", async () => {
    const onChange = vi.fn();
    const { rerender } = render(Fixture, {
      props: { selectionMode: "none", selectedRowIds: [1], onSelectedRowIdsChange: onChange },
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
    await fireEvent.click(rowCheckbox("Grace"));
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
      render(Fixture, { props: { selectionMode: "single" } });
      expect(
        screen.queryByRole("checkbox", { name: "Select all visible rows" }),
      ).not.toBeInTheDocument();
      expect(screen.getAllByRole("columnheader")[0]).toHaveTextContent("Selection");
    });

    it("replaces the selection and empties it on a re-toggle", async () => {
      const onChange = vi.fn();
      render(Fixture, {
        props: { selectionMode: "single", onSelectedRowIdsChange: onChange, bindSelection: true },
      });
      await fireEvent.click(rowCheckbox("Ada"));
      expect(onChange).toHaveBeenLastCalledWith([1]);
      await fireEvent.click(rowCheckbox("Grace"));
      expect(onChange).toHaveBeenLastCalledWith([2]);
      // Re-toggling the selected row returns the selection to zero.
      await fireEvent.click(rowCheckbox("Grace"));
      expect(onChange).toHaveBeenLastCalledWith([]);
      expect(onChange).toHaveBeenCalledTimes(3);
    });
  });

  describe("select-all over the rendered page", () => {
    it("appends the visible selectable rows and preserves off-page ids", async () => {
      const onChange = vi.fn();
      render(Fixture, {
        props: { pageSize: 2, selectedRowIds: [2], onSelectedRowIdsChange: onChange },
      });
      // Page 1 shows Ada (1) and alan (3); Grace (2) is selected off-page.
      await fireEvent.click(selectAll());
      expect(onChange).toHaveBeenLastCalledWith([2, 1, 3]);
      expect(selectAll()).toBeChecked();
      // A second activation removes only the page's rows.
      await fireEvent.click(selectAll());
      expect(onChange).toHaveBeenLastCalledWith([2]);
      expect(onChange).toHaveBeenCalledTimes(2);
    });

    it("shows indeterminate on a partial page and reacts to sorting", async () => {
      render(Fixture, { props: { pageSize: 2, selectedRowIds: [1] } });
      // Ada is selected on the page beside the unselected alan.
      expect(selectAll().indeterminate).toBe(true);
      // Descending sort brings Grace and Edsger in: nothing selected here.
      const nameButton = within(screen.getByRole("columnheader", { name: /Name/ })).getByRole(
        "button",
      );
      await fireEvent.click(nameButton);
      expect(selectAll().indeterminate).toBe(false);
      expect(selectAll()).not.toBeChecked();
    });

    it("is disabled when no rendered row is selectable", () => {
      render(Fixture, { props: { isRowSelectable: () => false } });
      expect(selectAll()).toBeDisabled();
      expect(screen.getAllByRole("checkbox")).toHaveLength(1);
    });
  });

  describe("non-selectable rows", () => {
    it("renders no checkbox for them and skips them in select-all", async () => {
      const onChange = vi.fn();
      render(Fixture, {
        props: {
          isRowSelectable: (row) => row.name !== "Ada",
          onSelectedRowIdsChange: onChange,
        },
      });
      expect(screen.queryByRole("checkbox", { name: "Select Ada" })).not.toBeInTheDocument();
      await fireEvent.click(selectAll());
      expect(onChange).toHaveBeenLastCalledWith([3, 5, 4, 2]);
    });

    it("retains selected ids of rows that became non-selectable", () => {
      const onChange = vi.fn();
      render(Fixture, {
        props: {
          selectedRowIds: [1],
          isRowSelectable: (row) => row.name !== "Ada",
          onSelectedRowIdsChange: onChange,
        },
      });
      // Ada keeps her selected state, loses only the control.
      expect(screen.queryByRole("checkbox", { name: "Select Ada" })).not.toBeInTheDocument();
      const adaRow = screen.getByText("Ada").closest("tr");
      expect(adaRow).toHaveAttribute("data-selected");
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  it("keeps the selection across sorting and page changes", async () => {
    render(Fixture, { props: { pageSize: 2, bindSelection: true } });
    await fireEvent.click(rowCheckbox("Ada"));
    // Page 2 (Barbara, Edsger), then back: Ada is still selected.
    await fireEvent.click(screen.getByRole("button", { name: "Go to page 2" }));
    expect(screen.queryByRole("checkbox", { name: "Select Ada" })).not.toBeInTheDocument();
    await fireEvent.click(screen.getByRole("button", { name: "Go to page 1" }));
    expect(rowCheckbox("Ada")).toBeChecked();
  });

  describe("card view", () => {
    it("renders named checkboxes beside the cards and marks selected items", async () => {
      render(Fixture, { props: { view: "card", selectedRowIds: [1] } });
      const list = screen.getByRole("list", { name: "People" });
      const adaItem = within(list)
        .getByRole("checkbox", { name: "Select Ada" })
        .closest("[role='listitem']");
      expect(adaItem).toHaveAttribute("data-selected");
      // The select-all control lives outside the list, with a visible label.
      const all = selectAll();
      expect(list.contains(all)).toBe(false);
      expect(screen.getByText("Select all visible rows")).toBeVisible();
      await fireEvent.click(all);
      expect(within(list).getByRole("checkbox", { name: "Select Grace" })).toBeChecked();
    });
  });

  describe("development failures", () => {
    it("throws on a row without a stable id", () => {
      expect(() =>
        render(Fixture, { props: { rows: [{ name: "NoId", age: 1, city: "X" }] } }),
      ).toThrow(/\[ds\] Row selection needs a stable id/);
    });

    it("throws on a duplicate row id", () => {
      expect(() =>
        render(Fixture, {
          props: {
            rows: [
              { id: 1, name: "Ada", age: 36, city: "London" },
              { id: 1, name: "Grace", age: 85, city: "New York" },
            ],
          },
        }),
      ).toThrow(/\[ds\] Duplicate row id "1"/);
    });

    it("throws when getRowLabel yields nothing or only spaces", () => {
      const nullish = (() => undefined) as unknown as () => string;
      expect(() => render(Fixture, { props: { getRowLabel: nullish } })).toThrow(
        /\[ds\] Row selection needs `getRowLabel`/,
      );
      expect(() => render(Fixture, { props: { getRowLabel: () => "   " } })).toThrow(
        /\[ds\] Row selection needs `getRowLabel`/,
      );
    });

    it("accepts the same rows while selection is off", () => {
      expect(() =>
        render(Fixture, {
          props: { selectionMode: "none", rows: [{ name: "NoId", age: 1, city: "X" }] },
        }),
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
      const onChange = vi.fn();
      render(Fixture, {
        props: { views, bindSelection: true, onSelectedRowIdsChange: onChange },
      });
      await fireEvent.click(rowCheckbox("Ada"));
      expect(onChange).toHaveBeenLastCalledWith(["p1"]);
      await fireEvent.click(screen.getByRole("tab", { name: "Orders" }));
      // The shared selection holds no id of this view's rows.
      expect(rowCheckbox("A1")).not.toBeChecked();
      await fireEvent.click(screen.getByRole("tab", { name: "People" }));
      expect(rowCheckbox("Ada")).toBeChecked();
    });
  });

  it("calls only the replacement callback after the prop is swapped", async () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = render(Fixture, { props: { onSelectedRowIdsChange: first } });
    await rerender({ onSelectedRowIdsChange: second });
    await fireEvent.click(rowCheckbox("Ada"));
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("accepts a controlled give-back without churn or callbacks", async () => {
    const onChange = vi.fn();
    render(Fixture, {
      props: { bindSelection: true, onSelectedRowIdsChange: onChange },
    });
    await fireEvent.click(rowCheckbox("Ada"));
    // bindSelection feeds the emitted array back into the prop: the mirror
    // must recognize the same content and stay quiet.
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(rowCheckbox("Ada")).toBeChecked();
    await fireEvent.click(rowCheckbox("Grace"));
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenLastCalledWith([1, 2]);
  });

  it("throws on a controlled selection that carries duplicate ids", () => {
    expect(() => render(Fixture, { props: { selectedRowIds: [1, 1] } })).toThrow(
      /\[ds\] `selectedRowIds` must not contain duplicate ids/,
    );
  });

  it("follows rows through sort, paging and card view with a custom getRowId", async () => {
    const getRowId = (row: Record<string, unknown>) => `k-${String(row.name)}`;
    render(Fixture, { props: { pageSize: 2, bindSelection: true, getRowId } });
    await fireEvent.click(rowCheckbox("Ada"));
    // Descending sort moves Ada off the page; her id is retained.
    const nameButton = within(screen.getByRole("columnheader", { name: /Name/ })).getByRole(
      "button",
    );
    await fireEvent.click(nameButton);
    expect(screen.queryByRole("checkbox", { name: "Select Ada" })).not.toBeInTheDocument();
    await fireEvent.click(screen.getByRole("button", { name: "Go to page 3" }));
    expect(rowCheckbox("Ada")).toBeChecked();
    expect(rowCheckbox("Ada").closest("tr")).toHaveAttribute("data-selected");
  });

  it("has no axe violations with selection enabled", async () => {
    const { container } = render(Fixture, { props: { selectedRowIds: [1] } });
    expect(await axe(container)).toHaveNoViolations();
  });
});
