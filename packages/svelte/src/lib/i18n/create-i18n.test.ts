import { get } from "svelte/store";
import { describe, expect, it } from "vitest";
import { createI18n } from "./create-i18n";

describe("createI18n", () => {
  it("translates from the English catalog by default", () => {
    const { t } = createI18n();
    expect(get(t)("calendar.today")).toBe("Today");
    expect(get(t)("datePicker.placeholder")).toBe("Select a date");
  });

  it("applies message overrides", () => {
    const { t } = createI18n({ messages: { "calendar.today": "Oggi" } });
    expect(get(t)("calendar.today")).toBe("Oggi");
    // non-overridden keys still fall back to English
    expect(get(t)("calendar.next")).toBe("Next");
  });

  it("interpolates {placeholders}", () => {
    const { t } = createI18n({ messages: { "calendar.today": "Vai a {when}" } });
    expect(get(t)("calendar.today", { when: "oggi" })).toBe("Vai a oggi");
  });

  it("updates locale, dir and messages via set()", () => {
    const i18n = createI18n();
    expect(get(i18n.dir)).toBe("ltr");
    i18n.set({ dir: "rtl", locale: "ar", messages: { "calendar.next": "التالي" } });
    expect(get(i18n.dir)).toBe("rtl");
    expect(get(i18n.locale)).toBe("ar");
    expect(get(i18n.t)("calendar.next")).toBe("التالي");
  });
});
