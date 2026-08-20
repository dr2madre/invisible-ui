/**
 * Locale resolution shared by every adapter. The library never formats with
 * the runtime's own locale: everything resolves to an explicit BCP-47 tag so
 * server and client render the same output.
 */

/** The documented library default locale. */
export const DEFAULT_LOCALE = "en";

export type Dir = "ltr" | "rtl";

/**
 * Languages written right-to-left, used when the runtime cannot say
 * (`Intl.Locale` text info is not available everywhere).
 */
const RTL_LANGUAGES = new Set([
  "ar",
  "arc",
  "ckb",
  "dv",
  "fa",
  "he",
  "ku",
  "ps",
  "sd",
  "ug",
  "ur",
  "yi",
]);
const RTL_SCRIPTS = new Set(["Arab", "Hebr", "Thaa", "Nkoo", "Rohg"]);

declare global {
  interface Console {
    warn(...data: unknown[]): void;
  }
}

/**
 * Canonicalize a BCP-47 tag. A malformed tag is a consumer error: it warns in
 * development terms (console) and falls back to the library default, never to
 * the runtime locale, so the result stays deterministic under SSR.
 */
export function canonicalLocale(tag: string | undefined | null): string {
  if (!tag) return DEFAULT_LOCALE;
  try {
    return Intl.getCanonicalLocales(tag)[0] ?? DEFAULT_LOCALE;
  } catch {
    if (typeof console !== "undefined") {
      console.warn(`[ds] Invalid BCP-47 locale "${String(tag)}"; using "${DEFAULT_LOCALE}".`);
    }
    return DEFAULT_LOCALE;
  }
}

type LocaleInfo = {
  getTextInfo?: () => { direction?: string };
  textInfo?: { direction?: string };
  getWeekInfo?: () => { firstDay?: number };
  weekInfo?: { firstDay?: number };
  getHourCycles?: () => string[];
  hourCycles?: string[];
};

/**
 * The writing direction of a locale, by one shared rule: the runtime's text
 * info where available (method or property; engines differ), otherwise a
 * fixed right-to-left language/script list.
 */
export function localeDirection(locale: string): Dir {
  try {
    const info = new Intl.Locale(canonicalLocale(locale)) as unknown as LocaleInfo & {
      language: string;
      script?: string;
    };
    const text = info.getTextInfo?.() ?? info.textInfo;
    if (text?.direction === "rtl") return "rtl";
    if (text?.direction === "ltr") return "ltr";
    if (info.script && RTL_SCRIPTS.has(info.script)) return "rtl";
    return RTL_LANGUAGES.has(info.language) ? "rtl" : "ltr";
  } catch {
    return "ltr";
  }
}

/**
 * The locale's first day of week (1 = Monday … 7 = Sunday), or `null` where
 * the runtime cannot say. Callers keep their own documented default.
 */
export function localeWeekStart(locale: string): number | null {
  try {
    const info = new Intl.Locale(canonicalLocale(locale)) as unknown as LocaleInfo;
    const week = info.getWeekInfo?.() ?? info.weekInfo;
    const day = week?.firstDay;
    return typeof day === "number" && day >= 1 && day <= 7 ? day : null;
  } catch {
    return null;
  }
}

/**
 * The locale's preferred hour cycle as 12 or 24, or `null` where the runtime
 * cannot say. Callers keep their own documented default.
 */
export function localeHourCycle(locale: string): 12 | 24 | null {
  try {
    const info = new Intl.Locale(canonicalLocale(locale)) as unknown as LocaleInfo;
    const cycles = info.getHourCycles?.() ?? info.hourCycles;
    const first = cycles?.[0];
    if (first === "h11" || first === "h12") return 12;
    if (first === "h23" || first === "h24") return 24;
    return null;
  } catch {
    return null;
  }
}
