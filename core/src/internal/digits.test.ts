import { describe, expect, it } from "vitest";
import { foldDigits } from "../i18n/format";
import { foldArabicDigits } from "./digits";

describe("foldArabicDigits", () => {
  it("folds Arabic-Indic and Persian digits to ASCII, and nothing else", () => {
    expect(foldArabicDigits("٠١٢٣٤٥٦٧٨٩ ۰۱۲۳۴۵۶۷۸۹")).toBe("0123456789 0123456789");
    const text = "abc 12 ٫٬ ب";
    expect(foldArabicDigits(text)).toBe(text);
  });

  it("leaves the public foldDigits as it was: only the locale's own digits fold", () => {
    expect(foldDigits("12x٣", "en")).toBe("12x٣");
    expect(foldDigits("١٢", "ar-EG")).toBe("12");
  });
});
