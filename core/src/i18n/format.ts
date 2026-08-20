import { canonicalLocale } from "./locale";

/**
 * Cached, deterministic `Intl` factories shared by every adapter. Every call
 * requires an explicit locale (never the runtime default), so server and
 * client agree. Instances are immutable, and the cache key carries the locale
 * plus every option, so concurrent scopes and SSR requests cannot leak into
 * each other.
 */

const CACHE_CAP = 64;

function cached<T>(store: Map<string, T>, key: string, create: () => T): T {
  const hit = store.get(key);
  if (hit) return hit;
  const value = create();
  if (store.size >= CACHE_CAP) {
    const oldest = store.keys().next().value;
    if (oldest !== undefined) store.delete(oldest);
  }
  store.set(key, value);
  return value;
}

const dateTimeCache = new Map<string, Intl.DateTimeFormat>();
const numberCache = new Map<string, Intl.NumberFormat>();
const pluralCache = new Map<string, Intl.PluralRules>();

/**
 * A date/time formatter pinned to the Gregorian calendar: the library's date
 * state is Gregorian, and some engines resolve locales such as `ar-SA` to
 * another calendar by default, which would disagree with the core arithmetic.
 */
export function dateTimeFormat(
  locale: string,
  options: Intl.DateTimeFormatOptions = {},
): Intl.DateTimeFormat {
  const tag = canonicalLocale(locale);
  const merged: Intl.DateTimeFormatOptions = { calendar: "gregory", ...options };
  const key = `${tag}|${JSON.stringify(merged)}`;
  return cached(dateTimeCache, key, () => new Intl.DateTimeFormat(tag, merged));
}

/** A number formatter for the resolved locale. */
export function numberFormat(
  locale: string,
  options: Intl.NumberFormatOptions = {},
): Intl.NumberFormat {
  const tag = canonicalLocale(locale);
  const key = `${tag}|${JSON.stringify(options)}`;
  return cached(numberCache, key, () => new Intl.NumberFormat(tag, options));
}

/** Plural rules for the resolved locale. */
export function pluralRules(
  locale: string,
  options: Intl.PluralRulesOptions = {},
): Intl.PluralRules {
  const tag = canonicalLocale(locale);
  const key = `${tag}|${JSON.stringify(options)}`;
  return cached(pluralCache, key, () => new Intl.PluralRules(tag, options));
}

/** The number symbols and digits a locale displays. */
export interface NumberSymbols {
  decimal: string;
  group: string;
  minusSign: string;
  /** The ten digits of the locale's default numbering system, 0 through 9. */
  digits: string[];
}

const symbolsCache = new Map<string, NumberSymbols>();

/**
 * Resolve the display symbols and digits for a locale. This is a formatting
 * fact sheet for later numeric work; it never parses user text.
 */
export function numberSymbols(locale: string): NumberSymbols {
  const tag = canonicalLocale(locale);
  return cached(symbolsCache, tag, () => {
    const parts = numberFormat(tag).formatToParts(-12345.6);
    const find = (type: string, fallback: string) =>
      parts.find((part) => part.type === type)?.value ?? fallback;
    const digitFormat = numberFormat(tag, { useGrouping: false });
    const digits = Array.from({ length: 10 }, (_, n) => digitFormat.format(n));
    return {
      decimal: find("decimal", "."),
      group: find("group", ","),
      minusSign: find("minusSign", "-"),
      digits,
    };
  });
}

/**
 * Map a locale's digits in a string to ASCII digits, character by character.
 * Everything else passes through untouched: this folds digits, it does not
 * interpret or parse the text.
 */
export function foldDigits(text: string, locale: string): string {
  const { digits } = numberSymbols(locale);
  if (digits[0] === "0") return text;
  let out = "";
  for (const char of text) {
    const index = digits.indexOf(char);
    out += index === -1 ? char : String(index);
  }
  return out;
}
