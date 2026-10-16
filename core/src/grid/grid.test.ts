import { describe, expect, it } from "vitest";
import { numberSymbols } from "../i18n/format";
import { clampActive } from "./active";
import { acceptsCharacter, gridKeyCommand, matchesShortcut } from "./keyboard";
import { cellLabel } from "./label";
import { gridTotals, sumValues } from "./totals";
import type { GridCellKind, GridKey, GridKeyOptions, GridShape } from "./types";

// The behaviour the shared vectors leave out: both directions for every
// navigation key and every kind, the adapter's own translator, the shape
// clamp and the characters a key can carry.

const kinds: GridCellKind[][] = [
  ["readonly", "editable", "summary", "readonly"],
  ["readonly", "readonly", "readonly", "readonly"],
];
const shape: GridShape = {
  rowCount: kinds.length,
  columnCount: kinds[0]!.length,
  kindAt: ({ row, column }) => kinds[row]![column]!,
  hasDetails: ({ row, column }) => kinds[row]![column] !== "readonly",
};
const key = (name: string, extra: Partial<GridKey> = {}): GridKey => ({
  key: name,
  ctrl: false,
  meta: false,
  alt: false,
  shift: false,
  composing: false,
  ...extra,
});
const options = (direction: "ltr" | "rtl"): GridKeyOptions => ({
  direction,
  pageRows: 1,
  accepts: (char) => acceptsCharacter(char, numberSymbols("en"), false),
});

describe("grid navigation keys in both directions", () => {
  for (const direction of ["ltr", "rtl"] as const) {
    const next = direction === "rtl" ? "ArrowLeft" : "ArrowRight";
    const previous = direction === "rtl" ? "ArrowRight" : "ArrowLeft";
    for (const column of [0, 1, 2, 3]) {
      const kind = kinds[0]![column];
      it(`${direction}: arrows, Home and End from a ${kind} cell in column ${column}`, () => {
        const active = { row: 0, column };
        const run = (name: string, extra?: Partial<GridKey>) =>
          gridKeyCommand("navigate", active, key(name, extra), shape, options(direction));
        expect(run(next)).toEqual({
          type: "move",
          to: { row: 0, column: Math.min(3, column + 1) },
        });
        expect(run(previous)).toEqual({
          type: "move",
          to: { row: 0, column: Math.max(0, column - 1) },
        });
        expect(run("ArrowDown")).toEqual({ type: "move", to: { row: 1, column } });
        expect(run("Home")).toEqual({ type: "move", to: { row: 0, column: 0 } });
        expect(run("End")).toEqual({ type: "move", to: { row: 0, column: 3 } });
        expect(run("End", { ctrl: true })).toEqual({ type: "move", to: { row: 1, column: 3 } });
        expect(run("Escape")).toEqual({ type: "none" });
        expect(run("Tab")).toEqual({ type: "none" });
      });
    }
  }

  it("Tab while editing follows logical order in right-to-left text", () => {
    const command = gridKeyCommand(
      "edit",
      { row: 0, column: 1 },
      key("Tab"),
      shape,
      options("rtl"),
    );
    expect(command).toEqual({ type: "commit", then: "leave", forward: true });
  });
});

describe("accepted characters", () => {
  it("takes one character only", () => {
    expect(acceptsCharacter("12", numberSymbols("en"), false)).toBe(false);
    expect(acceptsCharacter("", numberSymbols("en"), false)).toBe(false);
  });

  it("takes the typographic minus sign when negative numbers are allowed", () => {
    expect(acceptsCharacter("−", numberSymbols("en"), true)).toBe(true);
    expect(acceptsCharacter("−", numberSymbols("en"), false)).toBe(false);
  });

  it("takes ASCII digits under a locale with its own digits", () => {
    expect(acceptsCharacter("7", numberSymbols("ar-EG"), false)).toBe(true);
  });
});

describe("details shortcut", () => {
  it("needs every modifier to match", () => {
    const shortcut = { key: "Enter", ctrl: false, meta: false, alt: true, shift: false };
    expect(matchesShortcut(key("Enter", { alt: true }), shortcut)).toBe(true);
    expect(matchesShortcut(key("Enter", { alt: true, shift: true }), shortcut)).toBe(false);
    expect(matchesShortcut(key("Enter"), shortcut)).toBe(false);
    expect(matchesShortcut(key("Enter"), undefined)).toBe(false);
  });
});

describe("clampActive", () => {
  it("keeps a position inside the shape and moves one outside it to the edge", () => {
    expect(clampActive({ row: 1, column: 2 }, shape)).toEqual({ row: 1, column: 2 });
    expect(clampActive({ row: 9, column: 9 }, shape)).toEqual({ row: 1, column: 3 });
    expect(clampActive({ row: -1, column: -4 }, shape)).toEqual({ row: 0, column: 0 });
  });
});

describe("totals", () => {
  it("ignores values that are not finite", () => {
    expect(sumValues([Number.NaN, 2])).toBe(2);
  });

  it("totals ragged rows as if the missing cells were empty", () => {
    expect(gridTotals([[1], [2, 3]])).toEqual({ rows: [1, 5], columns: [3, 3], grand: 6 });
  });
});

describe("cellLabel", () => {
  it("uses an adapter's translator when one is given", () => {
    const seen: string[] = [];
    const label = cellLabel(
      { column: "Mon", row: "P", value: "5", secondary: "Holiday" },
      {
        translate: (messageKey, vars) => {
          seen.push(messageKey);
          return messageKey === "dataGrid.separator" ? " | " : `${vars?.column}/${vars?.value}`;
        },
      },
    );
    expect(label).toBe("Mon/5 | Holiday");
    expect(seen).toEqual(["dataGrid.cell", "dataGrid.separator"]);
  });

  it("leaves out empty parts", () => {
    expect(cellLabel({ column: "Mon", row: "P", value: "5", badge: "", error: "" })).toBe(
      "Mon, P, 5",
    );
  });
});
