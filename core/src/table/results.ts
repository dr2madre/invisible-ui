/**
 * The result count of a filtered table, announced when filtering changes it.
 *
 * The consumer filters outside the table, so the table only sees the rows it
 * is given and the signals `filtersActive` and `filterRevision`. This module
 * decides, from the last state it saw and the new one, whether the change
 * deserves one polite announcement. The first state is only remembered, and a
 * count that changes with no filtering behind it (a page of rows loaded on
 * demand) stays silent.
 */

/** What the table knows after a render. */
export interface TableResultsInput {
  /** The number of rows supplied, already filtered. */
  count: number;
  /** Whether the consumer's filters are active. */
  filtersActive: boolean;
  /** The consumer's filter revision, when it keeps one. */
  filterRevision?: string | number;
  /** The unfiltered row count when known; `0` means the dataset is empty. */
  totalRowCount?: number;
}

/** What to remember between two renders. */
export interface TableResultsMemory {
  count: number;
  filters: string;
}

/** What to announce: the count, or the no-results state. */
export type TableResultsMessage = { kind: "results"; count: number } | { kind: "no-results" };

export interface TableResultsUpdate {
  /** Pass this back with the next state. */
  memory: TableResultsMemory;
  /** `null` when the change needs no announcement. */
  message: TableResultsMessage | null;
}

/** Compare the new state with the last one seen (`null` for the first). */
export function tableResultsUpdate(
  previous: TableResultsMemory | null,
  next: TableResultsInput,
): TableResultsUpdate {
  const filters = `${next.filtersActive}|${next.filterRevision ?? ""}`;
  const memory = { count: next.count, filters };
  if (!previous || previous.count === next.count) return { memory, message: null };
  if (!next.filtersActive && previous.filters === filters) return { memory, message: null };
  const noResults = next.count === 0 && next.filtersActive && next.totalRowCount !== 0;
  return {
    memory,
    message: noResults ? { kind: "no-results" } : { kind: "results", count: next.count },
  };
}
