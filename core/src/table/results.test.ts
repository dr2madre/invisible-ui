import { describe, expect, it } from "vitest";
import { tableResultsUpdate, type TableResultsMemory } from "./results";

const first = tableResultsUpdate(null, { count: 5, filtersActive: false });

describe("table results announcement", () => {
  it("only remembers the first state", () => {
    expect(first.message).toBeNull();
    expect(first.memory).toEqual({ count: 5, filters: "false|" });
  });

  it("announces the new count when filtering changes it", () => {
    const next = tableResultsUpdate(first.memory, { count: 2, filtersActive: true });
    expect(next.message).toEqual({ kind: "results", count: 2 });
  });

  it("stays silent when the count did not change", () => {
    const next = tableResultsUpdate(first.memory, { count: 5, filtersActive: true });
    expect(next.message).toBeNull();
  });

  it("stays silent for a count that changes with no filtering behind it", () => {
    const next = tableResultsUpdate(first.memory, { count: 8, filtersActive: false });
    expect(next.message).toBeNull();
    expect(next.memory.count).toBe(8);
  });

  it("announces a cleared filter, whose revision or signal changed", () => {
    const filtered: TableResultsMemory = { count: 2, filters: "true|a" };
    const cleared = tableResultsUpdate(filtered, { count: 5, filtersActive: false });
    expect(cleared.message).toEqual({ kind: "results", count: 5 });
  });

  it("reports no results only when filters are active and the dataset is not empty", () => {
    const filtered: TableResultsMemory = { count: 2, filters: "true|" };
    expect(tableResultsUpdate(filtered, { count: 0, filtersActive: true }).message).toEqual({
      kind: "no-results",
    });
    expect(
      tableResultsUpdate(filtered, { count: 0, filtersActive: true, totalRowCount: 7 }).message,
    ).toEqual({ kind: "no-results" });
    expect(
      tableResultsUpdate(filtered, { count: 0, filtersActive: true, totalRowCount: 0 }).message,
    ).toEqual({ kind: "results", count: 0 });
  });
});
