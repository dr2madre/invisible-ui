/**
 * Locale resolution shared by every adapter. The library never formats with
 * the runtime's own locale: everything resolves to an explicit BCP-47 tag so
 * server and client render the same output.
 */

/**
 * The locale used when the app gives none and the page declares no language:
 * the catalog's language (English) with the international conventions of
 * CLDR's world region (`001`) and ISO 8601. Weeks start on Monday, time uses
 * the 24-hour cycle (`-u-hc-h23`), and numeric dates read year-month-day.
 */
export const DEFAULT_LOCALE = "en-001-u-hc-h23";

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

/** The language and direction a page declares, each `null` when absent. */
export interface PageLocale {
  locale: string | null;
  dir: Dir | null;
}

const DIR = '[dir="ltr" i], [dir="rtl" i]';

/**
 * The language and direction the page declares around `start`: the closest
 * `lang` and `dir` attributes, then the page's: for the direction `<body>`,
 * then the document element, so a page that sets `dir` on either is read the
 * same way. Without a document (server rendering) both are `null`.
 */
export function pageLocale(start?: Element | null): PageLocale {
  if (typeof document === "undefined") return { locale: null, dir: null };
  const root = document.documentElement;
  const lang = start?.closest("[lang]")?.getAttribute("lang") ?? root.getAttribute("lang");
  const dir = (start?.closest(DIR) ?? (document.body ?? root).closest(DIR))
    ?.getAttribute("dir")
    ?.toLowerCase();
  return {
    locale: lang?.trim() || null,
    dir: dir === "ltr" || dir === "rtl" ? dir : null,
  };
}

/**
 * The computed reading direction of `el`, so a `dir` anywhere above it counts:
 * a locale provider, the page, or a plain wrapper. A popup moved out of that
 * tree takes its direction from the element that opens it. `null` without an
 * element in a document.
 */
export function elementDirection(el: Element | null | undefined): Dir | null {
  const view = el?.isConnected ? el.ownerDocument.defaultView : null;
  if (!el || !view) return null;
  return view.getComputedStyle(el).direction === "rtl" ? "rtl" : "ltr";
}

const pageListeners = new Set<() => void>();
let pageObserver: MutationObserver | undefined;

/**
 * Call `listener` when the `lang` or `dir` of the document element or of
 * `<body>` changes, for an app that switches the page language at runtime.
 * Returns the function that stops it. Without a document it does nothing.
 * One observer serves every listener.
 */
export function subscribePageLocale(listener: () => void): () => void {
  if (typeof document === "undefined" || typeof MutationObserver === "undefined") {
    return () => {};
  }
  pageListeners.add(listener);
  if (!pageObserver) {
    pageObserver = new MutationObserver(() => {
      for (const notify of Array.from(pageListeners)) notify();
    });
    const watched = { attributes: true, attributeFilter: ["lang", "dir"] };
    pageObserver.observe(document.documentElement, watched);
    if (document.body) pageObserver.observe(document.body, watched);
  }
  return () => {
    pageListeners.delete(listener);
    if (pageListeners.size === 0) {
      pageObserver?.disconnect();
      pageObserver = undefined;
    }
  };
}

/**
 * The locale a component uses, by one rule for every adapter: the app's
 * locale (a provider or a prop), then the page's language, then
 * {@link DEFAULT_LOCALE}.
 */
export function resolveLocale(app?: string | null, page?: string | null): string {
  return canonicalLocale(app || page);
}
