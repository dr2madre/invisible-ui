import { describe, expect, it } from "vitest";
import type { NumberSymbols } from "../i18n/format";
import type { Messages } from "../i18n/messages";
import numberVectors from "../number-field/__vectors__/number-field.json";
import { resolveActive } from "./active";
import { acceptsCharacter, gridKeyCommand, initialActive, nextEditable } from "./keyboard";
import { cellLabel, detailsLabel, errorAnnouncement } from "./label";
import { gridTotals, sumValues } from "./totals";
import type {
  CellLabelParts,
  CellPos,
  GridCellKind,
  GridCellRef,
  GridIds,
  GridShape,
} from "./types";
import active from "./__vectors__/grid-active.json";
import keyboard from "./__vectors__/grid-keyboard.json";
import labels from "./__vectors__/grid-label.json";
import totals from "./__vectors__/grid-totals.json";

// The shared vectors are language-neutral: the Flutter adapter reads the same
// files, so both implementations answer the same cases.

const symbolTable = numberVectors.symbols as Record<string, NumberSymbols>;

/** The number-field table's symbols: language and region, then language, then English. */
function symbolsOf(tag: string): NumberSymbols {
  const [language, region] = tag.split("-");
  return symbolTable[`${language}-${region}`] ?? symbolTable[language!] ?? symbolTable.en!;
}

function shapeOf(kinds: string[][], details?: boolean[][]): GridShape {
  return {
    rowCount: kinds.length,
    columnCount: kinds[0]?.length ?? 0,
    kindAt: ({ row, column }) => kinds[row]![column] as GridCellKind,
    hasDetails: ({ row, column }) => details?.[row]?.[column] ?? false,
  };
}

interface KeyVector {
  name: string;
  mode?: "navigate" | "edit";
  active: CellPos;
  key: {
    key: string;
    ctrl?: boolean;
    meta?: boolean;
    alt?: boolean;
    shift?: boolean;
    composing?: boolean;
  };
  direction?: "ltr" | "rtl";
  pageRows?: number;
  locale?: string;
  negative?: boolean;
  shortcut?: { key: string; ctrl?: boolean; meta?: boolean; alt?: boolean; shift?: boolean } | null;
  expect: unknown;
}

const modifiers = (key: { ctrl?: boolean; meta?: boolean; alt?: boolean; shift?: boolean }) => ({
  ctrl: key.ctrl ?? false,
  meta: key.meta ?? false,
  alt: key.alt ?? false,
  shift: key.shift ?? false,
});

describe("grid keyboard vectors", () => {
  const shape = shapeOf(keyboard.kinds, keyboard.details);
  for (const vector of keyboard.keys as KeyVector[]) {
    it(vector.name, () => {
      const shortcut = vector.shortcut === undefined ? keyboard.detailsShortcut : vector.shortcut;
      const symbols = symbolsOf(vector.locale ?? "en");
      const command = gridKeyCommand(
        vector.mode ?? "navigate",
        vector.active,
        { key: vector.key.key, ...modifiers(vector.key), composing: vector.key.composing ?? false },
        shape,
        {
          direction: vector.direction ?? "ltr",
          pageRows: vector.pageRows ?? 2,
          accepts: (char) => acceptsCharacter(char, symbols, vector.negative ?? false),
          detailsShortcut: shortcut ? { key: shortcut.key, ...modifiers(shortcut) } : undefined,
        },
      );
      expect(command).toEqual(vector.expect);
    });
  }
  for (const vector of keyboard.nextEditable) {
    it(`next editable: ${vector.name}`, () => {
      expect(nextEditable(vector.from, vector.step as 1 | -1, shape)).toEqual(vector.expect);
    });
  }
  for (const vector of keyboard.initial) {
    it(`initial active cell: ${vector.name}`, () => {
      expect(initialActive(shapeOf(vector.kinds), vector.fallback)).toEqual(vector.expect);
    });
  }
});

describe("grid totals vectors", () => {
  for (const vector of totals.sum) {
    it(vector.name, () => {
      expect(sumValues(vector.values)).toBe(vector.expect);
    });
  }
  for (const vector of totals.grid) {
    it(`grid: ${vector.name}`, () => {
      expect(gridTotals(vector.values as (number | null)[][])).toEqual(vector.expect);
    });
  }
});

describe("grid active cell vectors", () => {
  for (const vector of active.cases) {
    it(vector.name, () => {
      expect(
        resolveActive(
          vector.previous as GridCellRef,
          vector.before as GridIds,
          vector.after as GridIds,
        ),
      ).toEqual(vector.expect);
    });
  }
});

describe("grid label vectors", () => {
  const locales = labels.locales as Record<string, Messages>;
  for (const vector of labels.labels) {
    it(vector.name, () => {
      const options = { messages: locales[vector.locale] };
      expect(cellLabel(vector.parts as CellLabelParts, options)).toBe(vector.expect);
    });
  }
  for (const vector of labels.details) {
    it(vector.name, () => {
      const options = { messages: locales[vector.locale] };
      expect(detailsLabel(vector.column, vector.row, options)).toBe(vector.expect);
    });
  }
  for (const vector of labels.announcements) {
    it(vector.name, () => {
      const options = { messages: locales[vector.locale] };
      expect(errorAnnouncement(vector.column, vector.row, vector.message, options)).toBe(
        vector.expect,
      );
    });
  }
});
