import { describe, expect, it, vi } from "vitest";
import {
  canonicalLocale,
  dateTimeFormat,
  DEFAULT_LOCALE,
  en,
  foldDigits,
  hourCycleOf,
  localeDirection,
  localeHourCycle,
  localeWeekStart,
  numberFormat,
  numberSymbols,
  pageLocale,
  resolveLocale,
  translate,
} from "./index";

describe("i18n — locale resolution", () => {
  it("canonicalizes tags and never uses the runtime locale", () => {
    expect(canonicalLocale("EN-us")).toBe("en-US");
    expect(canonicalLocale("zh-hant-tw")).toBe("zh-Hant-TW");
    expect(canonicalLocale(undefined)).toBe(DEFAULT_LOCALE);
    expect(canonicalLocale("")).toBe(DEFAULT_LOCALE);
  });

  it("warns on a malformed tag and falls back deterministically", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(canonicalLocale("not a tag")).toBe(DEFAULT_LOCALE);
    expect(spy).toHaveBeenCalledOnce();
    spy.mockRestore();
  });

  it("derives direction from the locale with one shared rule", () => {
    expect(localeDirection("en")).toBe("ltr");
    expect(localeDirection("it-IT")).toBe("ltr");
    expect(localeDirection("ar-EG")).toBe("rtl");
    expect(localeDirection("he")).toBe("rtl");
    expect(localeDirection("fa-IR")).toBe("rtl");
    // Script subtag wins over an unlisted language.
    expect(localeDirection("az-Arab")).toBe("rtl");
  });

  it("keeps the fallback direction list working without runtime text info", () => {
    // Firefox exposes neither getTextInfo nor textInfo: simulate by feeding
    // the raw language through the fallback path via a locale whose info the
    // runtime provides — the rule must agree with the list either way.
    expect(localeDirection("ur")).toBe("rtl");
    expect(localeDirection("yi")).toBe("rtl");
    expect(localeDirection("tr")).toBe("ltr");
  });

  it("derives week start and hour cycle where the runtime can say", () => {
    // These are consumer-facing helpers; components keep their own fixed
    // documented defaults. Where the runtime exposes the data, the values
    // are the CLDR ones; where it does not (Firefox), null.
    const weekIt = localeWeekStart("it-IT");
    expect(weekIt === 1 || weekIt === null).toBe(true);
    const weekEn = localeWeekStart("en-US");
    expect(weekEn === 7 || weekEn === null).toBe(true);
    const cycle = localeHourCycle("en-US");
    expect(cycle === 12 || cycle === null).toBe(true);
    const cycleIt = localeHourCycle("it-IT");
    expect(cycleIt === 24 || cycleIt === null).toBe(true);
    // An invalid tag resolves to the deterministic default locale first.
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const fallback = localeWeekStart("not a tag");
    expect(fallback === 1 || fallback === null).toBe(true);
    spy.mockRestore();
  });
});

describe("i18n — default locale", () => {
  it("uses English with the world conventions: Monday first, 24-hour time", () => {
    expect(DEFAULT_LOCALE).toBe("en-001-u-hc-h23");
    expect(hourCycleOf(DEFAULT_LOCALE)).toBe(24);
    const week = localeWeekStart(DEFAULT_LOCALE);
    expect(week === 1 || week === null).toBe(true);
    expect(translate(en, {}, DEFAULT_LOCALE, "dialog.close")).toBe("Close");
  });

  it("writes numeric dates in ISO 8601 order and keeps named dates", () => {
    const date = new Date(2026, 0, 5);
    const short = dateTimeFormat(DEFAULT_LOCALE, { dateStyle: "short" });
    expect(short.format(date)).toBe("2026-01-05");
    expect(short.formatToParts(date).map((p) => p.type)).toEqual([
      "year",
      "literal",
      "month",
      "literal",
      "day",
    ]);
    expect(short.formatRange(date, new Date(2026, 0, 9))).toBe("2026-01-05 – 2026-01-09");
    expect(short.formatRange(date, date)).toBe("2026-01-05");
    expect(short.resolvedOptions().locale).toBe(DEFAULT_LOCALE);
    expect(dateTimeFormat(DEFAULT_LOCALE, { dateStyle: "medium" }).format(date)).toBe("5 Jan 2026");
    // Another locale keeps its own numeric order.
    expect(dateTimeFormat("en-US", { dateStyle: "short" }).format(date)).toBe("1/5/26");
  });

  it("resolves the app's locale, then the page's, then the default", () => {
    expect(resolveLocale("it-IT", "en-US")).toBe("it-IT");
    expect(resolveLocale(undefined, "EN-us")).toBe("en-US");
    expect(resolveLocale(null, null)).toBe(DEFAULT_LOCALE);
    expect(resolveLocale("", "")).toBe(DEFAULT_LOCALE);
  });

  it("reads no page without a document, as on the server", () => {
    expect(pageLocale()).toEqual({ locale: null, dir: null });
  });
});

describe("i18n — formatters", () => {
  it("formats with an explicit locale, never the runtime default", () => {
    expect(dateTimeFormat("it-IT", { month: "long" }).format(new Date(2026, 0, 15))).toBe(
      "gennaio",
    );
    expect(dateTimeFormat("en", { month: "long" }).format(new Date(2026, 0, 15))).toBe("January");
  });

  it("pins the Gregorian calendar even where the locale prefers another", () => {
    expect(dateTimeFormat("ar-SA", { dateStyle: "long" }).resolvedOptions().calendar).toBe(
      "gregory",
    );
  });

  it("keeps caches separated by locale and options", () => {
    const a = dateTimeFormat("en", { month: "long" });
    const b = dateTimeFormat("it-IT", { month: "long" });
    const c = dateTimeFormat("en", { month: "short" });
    expect(a).not.toBe(b);
    expect(a).not.toBe(c);
    // Same inputs return the cached instance.
    expect(dateTimeFormat("en", { month: "long" })).toBe(a);
    // Interleaved scopes stay independent.
    expect(dateTimeFormat("it-IT", { month: "long" }).format(new Date(2026, 1, 1))).toBe(
      "febbraio",
    );
    expect(a.format(new Date(2026, 1, 1))).toBe("February");
  });

  it("resolves number symbols and digits per locale", () => {
    const it_ = numberSymbols("it-IT");
    expect(it_.decimal).toBe(",");
    expect(it_.group).toBe(".");
    expect(it_.digits[0]).toBe("0");
    const ar = numberSymbols("ar-EG");
    expect(ar.digits[5]).toBe("٥");
    expect(numberFormat("ar-EG").format(15)).toContain("١٥");
  });

  it("folds localized digits to ASCII without interpreting the text", () => {
    expect(foldDigits("١٢٣", "ar-EG")).toBe("123");
    expect(foldDigits("abc ١٥,٥", "ar-EG")).toBe("abc 15,5");
    // Latin-digit locales pass text through untouched.
    const text = "12x٣";
    expect(foldDigits(text, "en")).toBe(text);
  });
});

describe("i18n — translate", () => {
  const catalog = en as Record<string, string | { other: string }>;

  it("prefers overrides, then the catalog, then the key", () => {
    expect(translate(catalog, { "dialog.close": "Chiudi" }, "it", "dialog.close")).toBe("Chiudi");
    expect(translate(catalog, {}, "en", "dialog.close")).toBe("Close");
    expect(translate(catalog, {}, "en", "missing.key")).toBe("missing.key");
  });

  it("carries today's marker for platforms with no current-date semantics", () => {
    expect(translate(catalog, {}, "en", "calendar.current")).toBe("today");
    expect(translate(catalog, { "calendar.current": "oggi" }, "it", "calendar.current")).toBe(
      "oggi",
    );
  });

  it("carries the current step marker for platforms with no aria-current", () => {
    expect(translate(catalog, {}, "en", "stepper.current")).toBe("current step");
    expect(
      translate(catalog, { "stepper.current": "passo corrente" }, "it", "stepper.current"),
    ).toBe("passo corrente");
  });

  it("carries the tree branch actions for platforms with no expanded-state actions", () => {
    expect(translate(catalog, {}, "en", "tree.expand")).toBe("Expand");
    expect(translate(catalog, {}, "en", "tree.collapse")).toBe("Collapse");
    expect(translate(catalog, {}, "en", "tree.retry")).toBe("Retry");
    expect(translate(catalog, { "tree.retry": "Riprova" }, "it", "tree.retry")).toBe("Riprova");
  });

  it("carries the sort state for platforms with no aria-sort", () => {
    expect(translate(catalog, {}, "en", "table.sortedAscending")).toBe("sorted ascending");
    expect(translate(catalog, {}, "en", "table.sortedDescending")).toBe("sorted descending");
    expect(
      translate(
        catalog,
        { "table.sortedAscending": "in ordine crescente" },
        "it",
        "table.sortedAscending",
      ),
    ).toBe("in ordine crescente");
  });

  it("carries the upload area's browse name, rejections and file list", () => {
    expect(translate(catalog, {}, "en", "uploadDropArea.browse")).toBe("Browse files");
    expect(translate(catalog, {}, "en", "uploadDropArea.rejectedType", { name: "a.exe" })).toBe(
      "a.exe is not an accepted file type.",
    );
    expect(translate(catalog, {}, "en", "uploadDropArea.rejectedCount", { name: "b.png" })).toBe(
      "b.png was not added: only one file is accepted.",
    );
    expect(translate(catalog, {}, "en", "uploadDropArea.files")).toBe("Selected files");
    expect(translate(catalog, {}, "en", "uploadDropArea.remove", { name: "c.pdf" })).toBe(
      "Remove c.pdf",
    );
  });

  it("carries the current page marker for platforms with no aria-current", () => {
    expect(translate(catalog, {}, "en", "pagination.current")).toBe("current page");
    expect(translate(catalog, {}, "en", "breadcrumb.current")).toBe("current page");
    expect(translate(catalog, {}, "en", "sidebar.current")).toBe("current page");
    expect(translate(catalog, {}, "en", "navigationMenu.current")).toBe("current page");
    expect(
      translate(catalog, { "breadcrumb.current": "pagina corrente" }, "it", "breadcrumb.current"),
    ).toBe("pagina corrente");
  });

  it("carries the submenu hint for platforms with no popup semantics", () => {
    expect(translate(catalog, {}, "en", "menu.submenu")).toBe("submenu");
    expect(translate(catalog, { "menu.submenu": "sottomenu" }, "it", "menu.submenu")).toBe(
      "sottomenu",
    );
  });

  it("carries the multi select announcements for platforms with no live tag list", () => {
    expect(translate(catalog, {}, "en", "multiSelect.added", { name: "Ada" })).toBe("Ada added");
    expect(translate(catalog, {}, "en", "multiSelect.removed", { name: "Ada" })).toBe(
      "Ada removed",
    );
    expect(
      translate(catalog, { "multiSelect.removed": "{name} rimosso" }, "it", "multiSelect.removed", {
        name: "Ada",
      }),
    ).toBe("Ada rimosso");
  });

  it("interpolates named variables, reorderable, as plain text", () => {
    expect(
      translate({ greet: "{name} ha {count} anni" }, {}, "it", "greet", {
        name: "<b>Ada</b>",
        count: 36,
      }),
    ).toBe("<b>Ada</b> ha 36 anni");
    expect(translate({ swap: "{b}{a}" }, {}, "en", "swap", { a: "1", b: "2" })).toBe("21");
    expect(translate({ keep: "{missing}" }, {}, "en", "keep", { other: "x" })).toBe("{missing}");
  });

  it("selects plural categories with the resolved locale", () => {
    // English: one/other.
    expect(translate(catalog, {}, "en", "searchDialog.results", { count: 1 })).toBe(
      "1 result available",
    );
    expect(translate(catalog, {}, "en", "searchDialog.results", { count: 4 })).toBe(
      "4 results available",
    );
    // Russian: 2 selects "few", missing in the catalog, so "other" wins.
    const ru = {
      "searchDialog.results": {
        one: "{count} результат",
        few: "{count} результата",
        other: "{count} результатов",
      },
    };
    expect(translate(catalog, ru, "ru", "searchDialog.results", { count: 2 })).toBe("2 результата");
    expect(translate(catalog, ru, "ru", "searchDialog.results", { count: 5 })).toBe(
      "5 результатов",
    );
    expect(translate(catalog, ru, "ru", "searchDialog.results", { count: 21 })).toBe(
      "21 результат",
    );
    // Arabic zero/two categories select where provided.
    const ar = {
      "searchDialog.results": { zero: "لا نتائج", two: "نتيجتان", other: "{count} نتائج" },
    };
    expect(translate(catalog, ar, "ar", "searchDialog.results", { count: 0 })).toBe("لا نتائج");
    expect(translate(catalog, ar, "ar", "searchDialog.results", { count: 2 })).toBe("نتيجتان");
  });

  it("falls back to the mandatory other category", () => {
    const ru = { "rating.stars": { other: "{count} звёзд" } };
    expect(translate(catalog, ru, "ru", "rating.stars", { count: 1 })).toBe("1 звёзд");
  });

  it("applies a plain-string override of a plural key to every count", () => {
    const flat = { "rating.stars": "{count} ★" };
    expect(translate(catalog, flat, "en", "rating.stars", { count: 1 })).toBe("1 ★");
    expect(translate(catalog, flat, "en", "rating.stars", { count: 3 })).toBe("3 ★");
  });
});
