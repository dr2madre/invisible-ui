import { describe, expect, it } from "vitest";
import * as asyncContent from "./index";
import { deriveAsyncView } from "./derive";
import type { AsyncContentContext, AsyncView } from "./types";

// The whole truth table: status x hasContent x isEmpty (true/false/omitted).
// Contradictions are normalized: isEmpty counts only after success with no
// content; existing content always survives loading and errors.
const rows: Array<[AsyncContentContext, AsyncView]> = [
  [{ status: "idle", hasContent: false }, "idle"],
  [{ status: "idle", hasContent: false, isEmpty: false }, "idle"],
  [{ status: "idle", hasContent: false, isEmpty: true }, "idle"],
  [{ status: "idle", hasContent: true }, "idle"],
  [{ status: "idle", hasContent: true, isEmpty: false }, "idle"],
  [{ status: "idle", hasContent: true, isEmpty: true }, "idle"],
  [{ status: "loading", hasContent: false }, "initial-loading"],
  [{ status: "loading", hasContent: false, isEmpty: false }, "initial-loading"],
  [{ status: "loading", hasContent: false, isEmpty: true }, "initial-loading"],
  [{ status: "loading", hasContent: true }, "refreshing"],
  [{ status: "loading", hasContent: true, isEmpty: false }, "refreshing"],
  [{ status: "loading", hasContent: true, isEmpty: true }, "refreshing"],
  [{ status: "success", hasContent: false }, "content"],
  [{ status: "success", hasContent: false, isEmpty: false }, "content"],
  [{ status: "success", hasContent: false, isEmpty: true }, "empty"],
  [{ status: "success", hasContent: true }, "content"],
  [{ status: "success", hasContent: true, isEmpty: false }, "content"],
  [{ status: "success", hasContent: true, isEmpty: true }, "content"],
  [{ status: "error", hasContent: false }, "initial-error"],
  [{ status: "error", hasContent: false, isEmpty: false }, "initial-error"],
  [{ status: "error", hasContent: false, isEmpty: true }, "initial-error"],
  [{ status: "error", hasContent: true }, "stale-error"],
  [{ status: "error", hasContent: true, isEmpty: false }, "stale-error"],
  [{ status: "error", hasContent: true, isEmpty: true }, "stale-error"],
];

describe("async content — view derivation", () => {
  it.each(rows)("derives %j to the expected view", (context, view) => {
    expect(deriveAsyncView(context)).toBe(view);
  });

  it("is pure: repeated calls agree and the input is never mutated", () => {
    const context = Object.freeze({ status: "success", hasContent: false, isEmpty: true } as const);
    expect(deriveAsyncView(context)).toBe("empty");
    expect(deriveAsyncView(context)).toBe("empty");
    expect(context).toEqual({ status: "success", hasContent: false, isEmpty: true });
  });

  it("requires an explicit boolean true for isEmpty", () => {
    const truthy = { status: "success", hasContent: false, isEmpty: 1 } as unknown;
    expect(deriveAsyncView(truthy as AsyncContentContext)).toBe("content");
  });

  it("normalizes an unknown runtime status to the inert idle view", () => {
    const garbage = { status: "banana", hasContent: true } as unknown as AsyncContentContext;
    expect(deriveAsyncView(garbage)).toBe("idle");
  });

  it("exposes exactly the derivation through the module namespace", () => {
    expect(Object.keys(asyncContent)).toEqual(["deriveAsyncView"]);
    expect(typeof asyncContent.deriveAsyncView).toBe("function");
  });
});
