import { decimalsOf } from "../number-field/state";

/**
 * The sum of `values`, skipping `null`. Only `null` values (or none) total
 * `null`, shown empty. The sum is rounded to the largest number of decimals
 * among its terms, so 0.1 + 0.2 is 0.3: the terms are added as scaled
 * integers.
 */
export function sumValues(values: readonly (number | null)[]): number | null {
  const terms = values.filter((value): value is number => value != null && Number.isFinite(value));
  if (terms.length === 0) return null;
  const decimals = Math.min(12, Math.max(...terms.map(decimalsOf)));
  const scale = 10 ** decimals;
  let scaled = 0;
  for (const term of terms) scaled += Math.round(term * scale);
  const sum = scaled / scale;
  return Object.is(sum, -0) ? 0 : sum;
}

/** The derived totals of a grid of body values. */
export interface GridTotals {
  /** One per body row: the row total. */
  rows: (number | null)[];
  /** One per data column: the column total. */
  columns: (number | null)[];
  /** The sum of every body value. */
  grand: number | null;
}

/**
 * The row totals, column totals and grand total of `values`, one array per
 * body row with one value per data column. Summary and read-only cells count
 * with their value.
 */
export function gridTotals(values: readonly (readonly (number | null)[])[]): GridTotals {
  const width = values.reduce((max, row) => Math.max(max, row.length), 0);
  const columns: (number | null)[] = [];
  for (let column = 0; column < width; column++) {
    columns.push(sumValues(values.map((row) => row[column] ?? null)));
  }
  return {
    rows: values.map((row) => sumValues(row)),
    columns,
    grand: sumValues(values.flat()),
  };
}
