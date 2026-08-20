import { fireEvent, render, screen } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";
import { defaultGetRowId, type TableRow } from "./Table.svelte";
import { resolveSelectionIds } from "./create-table";
import Fixture from "./table-selection.fixture.svelte";

// Production build: `fail` never throws and the documented, unsupported
// fallbacks take over. The dev seam is mocked so both branches are testable.
vi.mock("../internal/dev", () => ({ DEV: false, fail: () => {} }));

describe("Svelte TableSet — row selection production fallbacks", () => {
  it("renders a row without a stable id as not selectable", () => {
    render(Fixture, {
      props: {
        rows: [
          { name: "NoId", age: 1, city: "X" },
          { id: 7, name: "Ada", age: 36, city: "London" },
        ],
      },
    });
    expect(screen.getByRole("checkbox", { name: "Select Ada" })).toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: "Select NoId" })).not.toBeInTheDocument();
  });

  it("keeps only the first occurrence of a duplicate id selectable", async () => {
    // The duplicate sits on another page, as with server data: the render
    // keys stay unique per page while the selection ids collide.
    render(Fixture, {
      props: {
        pageSize: 2,
        rows: [
          { id: 1, name: "Ada", age: 36, city: "London" },
          { id: 3, name: "alan", age: 41, city: "London" },
          { id: 1, name: "Grace", age: 85, city: "New York" },
        ],
      },
    });
    expect(screen.getByRole("checkbox", { name: "Select Ada" })).toBeInTheDocument();
    await fireEvent.click(screen.getByRole("button", { name: "Go to page 2" }));
    expect(screen.getByText("Grace")).toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: "Select Grace" })).not.toBeInTheDocument();
  });

  it("resolves same-page duplicate ids to a single operational control", () => {
    // Svelte's development runtime rejects duplicate render keys outright,
    // so the first-occurrence contract is proven at the resolver: the DOM
    // side is covered by the Vue adapter, which shares this resolution.
    const ada: TableRow = { id: 1, name: "Ada" };
    const grace: TableRow = { id: 1, name: "Grace" };
    const alan: TableRow = { id: 2, name: "alan" };
    const ids = resolveSelectionIds(
      [ada, grace, alan],
      "multiple",
      defaultGetRowId,
      defaultGetRowId,
    );
    expect(ids.get(ada)).toBe(1);
    expect(ids.get(grace)).toBeNull();
    expect(ids.get(alan)).toBe(2);
    // The same object twice cannot keep a first occurrence apart: both
    // stay inert, deterministically, never two controls for one id.
    const twice = resolveSelectionIds(
      [ada, ada, alan],
      "multiple",
      defaultGetRowId,
      defaultGetRowId,
    );
    expect(twice.get(ada)).toBeNull();
    expect(twice.get(alan)).toBe(2);
  });

  it("keeps the controlled selection untouched even with duplicate ids", () => {
    // Production never prunes consumer data; the duplicate is the consumer's
    // to fix and fails in development.
    const onChange = vi.fn();
    render(Fixture, { props: { selectedRowIds: [1, 1], onSelectedRowIdsChange: onChange } });
    expect(screen.getByRole("checkbox", { name: "Select Ada" })).toBeChecked();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("names the checkbox after the row id when the label is invalid", () => {
    render(Fixture, { props: { getRowLabel: () => "   " } });
    expect(screen.getByRole("checkbox", { name: "Select 1" })).toBeInTheDocument();
  });
});
