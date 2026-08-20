// @vitest-environment node
import { describe, expect, it } from "vitest";
import { deriveAsyncView } from "./index";

describe("async content — Node import", () => {
  it("imports and derives without any DOM", () => {
    expect(typeof document).toBe("undefined");
    expect(deriveAsyncView({ status: "loading", hasContent: true })).toBe("refreshing");
  });
});
