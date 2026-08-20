// @vitest-environment node
import { describe, expect, it } from "vitest";
import { dateTimeFormat, en, translate } from "./index";

describe("i18n — Node import", () => {
  it("imports and formats deterministically without any DOM", () => {
    expect(typeof document).toBe("undefined");
    expect(dateTimeFormat("it-IT", { month: "long" }).format(new Date(2026, 0, 15))).toBe(
      "gennaio",
    );
    expect(translate(en, {}, "en", "dialog.close")).toBe("Close");
  });
});
