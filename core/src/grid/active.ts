import type { CellPos, GridCellRef, GridIds, GridShape } from "./types";

/** `previous`, moved inside the shape when the grid shrank. */
export function clampActive(previous: CellPos, shape: GridShape): CellPos {
  return {
    row: Math.max(0, Math.min(shape.rowCount - 1, previous.row)),
    column: Math.max(0, Math.min(shape.columnCount - 1, previous.column)),
  };
}

function resolveId(id: string, before: readonly string[], after: readonly string[]): string | null {
  if (after.length === 0) return null;
  if (after.includes(id)) return id;
  const index = before.indexOf(id);
  return after[Math.max(0, Math.min(after.length - 1, index))]!;
}

/**
 * The active cell after the application changed its rows or columns. Each
 * id that still exists is kept; an id that is gone gives way to the id now
 * at its old position, clamped to the new size. `null` when the grid has no
 * rows or no columns left.
 */
export function resolveActive(
  previous: GridCellRef,
  before: GridIds,
  after: GridIds,
): GridCellRef | null {
  const rowId = resolveId(previous.rowId, before.rowIds, after.rowIds);
  const columnId = resolveId(previous.columnId, before.columnIds, after.columnIds);
  return rowId === null || columnId === null ? null : { rowId, columnId };
}
