import { render, screen } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TableSet } from "./TableSet";
import type { TableColumnDef, TableRow } from "./Table";

// Production build: `fail` never throws and the documented, unsupported
// fallbacks take over. The dev seam is mocked so both branches are testable.
vi.mock("../internal/dev", () => ({ DEV: false, fail: () => {} }));

const columns: TableColumnDef[] = [
  { key: "name", header: "Name", sortable: true },
  { key: "age", header: "Age", align: "end" },
];

const setup = (rows: TableRow[], props: Record<string, unknown> = {}) =>
  render(TableSet, {
    props: {
      columns,
      rows,
      caption: "People",
      selectionMode: "multiple",
      getRowLabel: (row: TableRow) => String(row.name),
      ...props,
    },
  });

describe("Vue TableSet — row selection production fallbacks", () => {
  it("renders a row without a stable id as not selectable", () => {
    setup([
      { name: "NoId", age: 1 },
      { id: 7, name: "Ada", age: 36 },
    ]);
    expect(screen.getByRole("checkbox", { name: "Select Ada" })).toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: "Select NoId" })).not.toBeInTheDocument();
  });

  it("keeps only the first occurrence of a duplicate id selectable", async () => {
    const user = userEvent.setup();
    // The duplicate sits on another page, as with server data: the render
    // keys stay unique per page while the selection ids collide.
    setup(
      [
        { id: 1, name: "Ada", age: 36 },
        { id: 3, name: "alan", age: 41 },
        { id: 1, name: "Grace", age: 85 },
      ],
      { pageSize: 2 },
    );
    expect(screen.getByRole("checkbox", { name: "Select Ada" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Go to page 2" }));
    expect(screen.getByText("Grace")).toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: "Select Grace" })).not.toBeInTheDocument();
  });

  it("first occurrence wins when duplicate ids share the same page", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    setup(
      [
        { id: 1, name: "Ada", age: 36 },
        { id: 1, name: "Grace", age: 85 },
        { id: 2, name: "alan", age: 41 },
      ],
      { onSelectedRowIdsChange: onChange },
    );
    // Both rows render; only the first occurrence of id 1 gets a control.
    expect(screen.getByText("Grace")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Select Ada" })).toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: "Select Grace" })).not.toBeInTheDocument();
    // The surviving control works, and select-all holds each id once.
    await user.click(screen.getByRole("checkbox", { name: "Select Ada" }));
    expect(onChange).toHaveBeenLastCalledWith([1]);
    await user.click(screen.getByRole("checkbox", { name: "Select all visible rows" }));
    expect(onChange).toHaveBeenLastCalledWith([1, 2]);
  });

  it("renders the same row object twice without any operational control", () => {
    // Two controls for one id are never acceptable, and two occurrences of
    // one object cannot be told apart: both stay inert, deterministically.
    const ada = { id: 1, name: "Ada", age: 36 };
    setup([ada, ada, { id: 2, name: "alan", age: 41 }]);
    expect(screen.queryAllByRole("checkbox", { name: "Select Ada" })).toHaveLength(0);
    expect(screen.getByRole("checkbox", { name: "Select alan" })).toBeInTheDocument();
  });

  it("keeps the controlled selection untouched even with duplicate ids", () => {
    // Production never prunes consumer data; the duplicate is the consumer's
    // to fix and fails in development.
    const onChange = vi.fn();
    setup([{ id: 1, name: "Ada", age: 36 }], {
      selectedRowIds: [1, 1],
      onSelectedRowIdsChange: onChange,
    });
    expect(screen.getByRole("checkbox", { name: "Select Ada" })).toBeChecked();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("names the checkbox after the row id when the label is invalid", () => {
    setup([{ id: 1, name: "Ada", age: 36 }], { getRowLabel: () => "   " });
    expect(screen.getByRole("checkbox", { name: "Select 1" })).toBeInTheDocument();
  });
});
