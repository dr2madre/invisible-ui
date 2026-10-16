/**
 * The text a data grid composes from the message catalog: each cell's spoken
 * label on a platform whose cells carry their own context (the Flutter
 * adapter, and an application's card view), the details button's name and
 * the error announcement every adapter makes.
 */
import { DEFAULT_LOCALE } from "../i18n/locale";
import { en, type MessageKey, type Messages } from "../i18n/messages";
import { translate } from "../i18n/translate";
import type { CellLabelParts } from "./types";

/** Where the grid's words come from. */
export interface GridMessages {
  /** Resolved locale, for plural rules. Defaults to the catalog's. */
  locale?: string;
  /** Consumer catalog overrides. */
  messages?: Messages;
  /**
   * An adapter's own translator, already bound to its locale and overrides.
   * Given, it wins over `locale` and `messages`.
   */
  translate?: (key: MessageKey, vars?: Record<string, string | number>) => string;
}

const t = (options: GridMessages, key: MessageKey, vars?: Record<string, string>) =>
  options.translate
    ? options.translate(key, vars)
    : translate(en, options.messages ?? {}, options.locale ?? DEFAULT_LOCALE, key, vars);

/**
 * A cell's spoken label (docs/editable-grid-spec.md, "Flutter semantics
 * fallback"): the column label, the row label and the value text in the
 * order the catalog's `dataGrid.cell` gives, then the badge, the secondary
 * label and the error message prefixed with `dataGrid.error`, joined with
 * `dataGrid.separator`. Totals and the row header use their own messages.
 */
export function cellLabel(parts: CellLabelParts, options: GridMessages = {}): string {
  const column = parts.column ?? "";
  const row = parts.row ?? "";
  const value = parts.value ?? "";
  let base: string;
  switch (parts.kind ?? "cell") {
    case "rowHeader":
      base = parts.value === undefined ? row : t(options, "dataGrid.rowHeader", { row, value });
      break;
    case "columnTotal":
      base = t(options, "dataGrid.columnTotal", { column, value });
      break;
    case "rowTotal":
      base = t(options, "dataGrid.rowTotal", { row, value });
      break;
    case "grandTotal":
      base = t(options, "dataGrid.grandTotal", { value });
      break;
    default:
      base = t(options, "dataGrid.cell", { column, row, value });
  }
  const extras = [parts.badge, parts.secondary];
  if (parts.error) extras.push(t(options, "dataGrid.error", { message: parts.error }));
  return [base, ...extras.filter((part): part is string => !!part)].join(
    t(options, "dataGrid.separator"),
  );
}

/** The details button's accessible name: "Details, Monday 6 October, PX-12 Project X". */
export function detailsLabel(column: string, row: string, options: GridMessages = {}): string {
  return t(options, "dataGrid.detailsLabel", { column, row });
}

/**
 * The polite announcement of an error that appears on commit: "{column},
 * {row}: {message}". A column total passes the catalog's `dataGrid.total`
 * as its row label, a row total as its column label.
 */
export function errorAnnouncement(
  column: string,
  row: string,
  message: string,
  options: GridMessages = {},
): string {
  return t(options, "dataGrid.announcement", { column, row, message });
}
