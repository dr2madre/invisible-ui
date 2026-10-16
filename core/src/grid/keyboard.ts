import type { NumberSymbols } from "../i18n/format";
import type {
  CellPos,
  GridCommand,
  GridKey,
  GridKeyOptions,
  GridMode,
  GridShape,
  GridShortcut,
} from "./types";

const NONE: GridCommand = { type: "none" };

const anyModifier = (key: GridKey) => key.ctrl || key.meta || key.alt || key.shift;

/** Whether `key` is the shortcut, modifiers included. Letters match in either case. */
export function matchesShortcut(key: GridKey, shortcut: GridShortcut | undefined): boolean {
  if (!shortcut) return false;
  return (
    key.key.toLowerCase() === shortcut.key.toLowerCase() &&
    key.ctrl === shortcut.ctrl &&
    key.meta === shortcut.meta &&
    key.alt === shortcut.alt &&
    key.shift === shortcut.shift
  );
}

/**
 * Whether a typed character starts editing a number cell: an ASCII digit,
 * one of the locale's digits, an Arabic-Indic or Persian digit (accepted in
 * every locale, as the Number Field accepts them), the locale's decimal
 * separator, and a minus sign when the editor allows negative numbers.
 */
export function acceptsCharacter(
  char: string,
  symbols: NumberSymbols,
  allowNegative: boolean,
): boolean {
  if ([...char].length !== 1) return false;
  if (/^[0-9٠-٩۰-۹]$/.test(char)) return true;
  if (symbols.digits.includes(char)) return true;
  if (char === symbols.decimal) return true;
  return allowNegative && (char === "-" || char === "−" || char === symbols.minusSign);
}

/**
 * The next editable cell after `from` in reading order (row by row, columns
 * in logical order), or the previous one with `step` -1. `null` when there is
 * none: Tab then leaves the grid.
 */
export function nextEditable(from: CellPos, step: 1 | -1, shape: GridShape): CellPos | null {
  const { rowCount, columnCount } = shape;
  let index = from.row * columnCount + from.column + step;
  const last = rowCount * columnCount;
  while (index >= 0 && index < last) {
    const pos = { row: Math.floor(index / columnCount), column: index % columnCount };
    if (shape.kindAt(pos) === "editable") return pos;
    index += step;
  }
  return null;
}

/**
 * The cell that takes the grid's tab stop the first time: the first
 * editable body cell, or `fallback` (the first body cell) when none is
 * editable.
 */
export function initialActive(shape: GridShape, fallback: CellPos): CellPos {
  return nextEditable({ row: 0, column: -1 }, 1, shape) ?? fallback;
}

const clamp = (value: number, max: number) => Math.max(0, Math.min(max, value));

function navigate(
  active: CellPos,
  key: GridKey,
  shape: GridShape,
  options: GridKeyOptions,
): GridCommand {
  const lastRow = shape.rowCount - 1;
  const lastColumn = shape.columnCount - 1;
  const move = (row: number, column: number): GridCommand => ({
    type: "move",
    to: { row: clamp(row, lastRow), column: clamp(column, lastColumn) },
  });
  const kind = shape.kindAt(active);

  if (key.key === "Home" || key.key === "End") {
    if (key.meta || key.alt || key.shift) return NONE;
    const home = key.key === "Home";
    if (key.ctrl) return home ? move(0, 0) : move(lastRow, lastColumn);
    return move(active.row, home ? 0 : lastColumn);
  }
  if (anyModifier(key)) return NONE;

  const forward = options.direction === "rtl" ? "ArrowLeft" : "ArrowRight";
  const backward = options.direction === "rtl" ? "ArrowRight" : "ArrowLeft";
  const page = Math.max(1, Math.floor(options.pageRows));
  switch (key.key) {
    case forward:
      return move(active.row, active.column + 1);
    case backward:
      return move(active.row, active.column - 1);
    case "ArrowDown":
      return move(active.row + 1, active.column);
    case "ArrowUp":
      return move(active.row - 1, active.column);
    case "PageDown":
      return move(active.row + page, active.column);
    case "PageUp":
      return move(active.row - page, active.column);
    case "Enter":
      if (kind === "editable") return { type: "edit", seed: "select" };
      return kind === "summary" ? { type: "activate" } : NONE;
    case "F2":
      return kind === "editable" ? { type: "edit", seed: "end" } : NONE;
    case "Backspace":
    case "Delete":
      return kind === "editable" ? { type: "edit", seed: "clear" } : NONE;
  }
  if (kind === "editable" && options.accepts(key.key)) {
    return { type: "edit", seed: "replace", text: key.key };
  }
  return NONE;
}

function edit(active: CellPos, key: GridKey, shape: GridShape): GridCommand {
  if (key.key === "Tab" && !key.ctrl && !key.meta && !key.alt) {
    const step = key.shift ? -1 : 1;
    const to = nextEditable(active, step, shape);
    if (to) return { type: "commit", then: key.shift ? "previous" : "next", to };
    return { type: "commit", then: "leave", forward: !key.shift };
  }
  if (anyModifier(key)) return NONE;
  switch (key.key) {
    case "Escape":
      return { type: "cancel" };
    case "Enter":
    case "F2":
      return { type: "commit", then: "stay" };
    case "ArrowUp":
      return { type: "step", direction: 1 };
    case "ArrowDown":
      return { type: "step", direction: -1 };
  }
  // Characters, the caret keys and deletion belong to the editor.
  return NONE;
}

/**
 * What a key does in the grid, for both modes (docs/editable-grid-spec.md,
 * "Navigation mode" and "Editing mode"). Pure: the adapter measures
 * `pageRows`, maps its key event to `GridKey` and applies the command.
 *
 * - Arrows never wrap; at an edge the command moves to the same cell, so the
 *   key is still consumed. Under right-to-left text the left arrow moves to
 *   the next column. Home, End and Tab follow logical order.
 * - A key held with Control, Meta or Alt never starts editing, and a key
 *   during text composition is left to the editor.
 * - Tab while editing commits and edits the next editable cell, Shift+Tab the
 *   previous one; past the last one it leaves the grid. In navigation mode
 *   Tab is not handled: the grid is one tab stop.
 * - Escape is not handled in navigation mode, so a dialog around the grid
 *   receives it.
 */
export function gridKeyCommand(
  mode: GridMode,
  active: CellPos,
  key: GridKey,
  shape: GridShape,
  options: GridKeyOptions,
): GridCommand {
  if (key.composing) return NONE;
  if (matchesShortcut(key, options.detailsShortcut)) {
    return shape.hasDetails(active) ? { type: "details", commitFirst: mode === "edit" } : NONE;
  }
  return mode === "edit" ? edit(active, key, shape) : navigate(active, key, shape, options);
}
