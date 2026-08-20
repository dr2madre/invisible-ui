// @vitest-environment node
import { describe, expect, it } from "vitest";
import { formatNumber, initialState, parseNumber } from "./index";

describe("number-field — Node import", () => {
  it("parses and formats deterministically without any DOM", () => {
    expect(typeof document).toBe("undefined");
    expect(parseNumber("1.234,5", "it-IT").value).toBe(1234.5);
    expect(formatNumber(12345.5, "it-IT")).toBe("12.345,5");
    expect(initialState({ value: 2, locale: "de-DE" }).inputValue).toBe("2");
  });
});
