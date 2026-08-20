import { canonicalLocale, DEFAULT_LOCALE } from "../i18n/locale";
import { foldDigits, numberFormat, numberSymbols } from "../i18n/format";
import type {
  NumberFieldContext,
  NumberFieldError,
  NumberFieldState,
  NumberParseResult,
} from "./types";

let idCounter = 0;

/** Count the decimal places of a number, including e-notation values. */
export function decimalsOf(value: number): number {
  if (!Number.isFinite(value)) return 0;
  const text = String(Math.abs(value));
  const e = text.indexOf("e");
  if (e !== -1) {
    const exponent = Number(text.slice(e + 1));
    const mantissa = text.slice(0, e);
    const dot = mantissa.indexOf(".");
    const mantissaDecimals = dot === -1 ? 0 : mantissa.length - dot - 1;
    return Math.max(0, mantissaDecimals - exponent);
  }
  const dot = text.indexOf(".");
  return dot === -1 ? 0 : text.length - dot - 1;
}

// Group separators typed with a plain or non-breaking space must all count
// as the locale's space grouping, because keyboards produce different spaces.
const SPACE_GROUPS = [" ", "\u00a0", "\u202f", "\u2009"];

/**
 * Parse an editing string against the locale's symbols. This classifies the
 * grammar only; range and step checks live in {@link validate}. Accepted
 * transients: empty, a lone sign, a lone decimal separator, and digits with
 * a trailing decimal separator.
 */
export function parseNumber(text: string, locale: string): NumberParseResult {
  const trimmed = text.trim();
  if (trimmed === "") return { status: "empty", value: null, error: null };

  const tag = canonicalLocale(locale);
  const symbols = numberSymbols(tag);
  // Formatters emit invisible direction marks around RTL numbers: they must
  // never make a pasted or reformatted value unparseable.
  let s = foldDigits(trimmed.replace(/[\u061c\u200e\u200f\u2066-\u2069]/g, ""), tag);

  const groups = /\s/.test(symbols.group) ? SPACE_GROUPS : [symbols.group];
  for (const group of groups) s = s.split(group).join("");
  if (symbols.minusSign !== "-") s = s.split(symbols.minusSign).join("-");
  // The typographic minus sign folds to the ASCII hyphen too.
  s = s.split("\u2212").join("-");
  if (symbols.decimal !== ".") s = s.split(symbols.decimal).join(".");

  if (/^[-+]$/.test(s) || /^[-+]?\.$/.test(s)) {
    return { status: "incomplete", value: null, error: null };
  }
  const complete = /^[-+]?(\d+(\.\d+)?|\.\d+)$/.test(s);
  const trailingSeparator = /^[-+]?\d+\.$/.test(s);
  if (!complete && !trailingSeparator) {
    return { status: "invalid", value: null, error: "parse" };
  }
  const value = Number(s);
  if (!Number.isFinite(value)) {
    return { status: "invalid", value: null, error: "parse" };
  }
  return {
    status: trailingSeparator ? "incomplete" : "valid",
    value: Object.is(value, -0) ? 0 : value,
    error: null,
  };
}

/** Report why a parsed value violates the constraints, or `null`. */
export function validate(
  value: number,
  min: number | null,
  max: number | null,
  step: number,
): NumberFieldError | null {
  if (min != null && value < min) return "range-underflow";
  if (max != null && value > max) return "range-overflow";
  const base = min ?? 0;
  const units = (value - base) / step;
  const distance = Math.abs(units - Math.round(units));
  // Tolerance absorbs float noise, so 0.3 with step 0.1 is not a mismatch.
  const tolerance = Math.max(1e-8, Math.abs(units) * Number.EPSILON * 4);
  if (distance > tolerance) return "step-mismatch";
  return null;
}

/** Parse and validate an editing string in one step. */
export function readValue(
  text: string,
  locale: string,
  min: number | null,
  max: number | null,
  step: number,
): NumberParseResult {
  const parsed = parseNumber(text, locale);
  if (parsed.status !== "valid" || parsed.value == null) return parsed;
  const error = validate(parsed.value, min, max, step);
  return error ? { status: "invalid", value: parsed.value, error } : parsed;
}

/** Localized display text for a value (empty string for `null`). */
export function formatNumber(value: number | null, locale: string): string {
  if (value == null) return "";
  return numberFormat(locale, { maximumFractionDigits: 15 }).format(value);
}

/** Canonical ASCII form value (empty string for `null`). */
export function canonicalString(value: number | null): string {
  if (value == null) return "";
  // A formatter, not String(): huge values must stay plain digits, not e-notation.
  return numberFormat("en", { useGrouping: false, maximumFractionDigits: 15 }).format(value);
}

const clampTo = (value: number, min: number | null, max: number | null): number => {
  if (min != null && value < min) return min;
  if (max != null && value > max) return max;
  return value;
};

/**
 * The next value for a spin action. From an on-grid value it moves one step;
 * from an off-grid value it moves to the nearest step multiple in the pressed
 * direction; from `null` it lands on the nearest bound to zero. The result is
 * clamped inside the bounds. Arithmetic runs on scaled integers so decimal
 * steps cannot drift.
 */
export function snapToStep(
  current: number | null,
  direction: 1 | -1,
  min: number | null,
  max: number | null,
  step: number,
): number {
  if (current == null) {
    return clampTo(direction === 1 ? (min ?? 0) : (max ?? 0), min, max);
  }
  const base = min ?? 0;
  const decimals = Math.min(12, Math.max(decimalsOf(step), decimalsOf(base), decimalsOf(current)));
  const scale = 10 ** decimals;
  const currentScaled = Math.round(current * scale);
  const baseScaled = Math.round(base * scale);
  const stepScaled = Math.round(step * scale);
  if (!Number.isFinite(currentScaled) || stepScaled <= 0) {
    return clampTo(current + direction * step, min, max);
  }
  const remainder = (((currentScaled - baseScaled) % stepScaled) + stepScaled) % stepScaled;
  const nextScaled =
    remainder === 0
      ? currentScaled + direction * stepScaled
      : direction === 1
        ? currentScaled + (stepScaled - remainder)
        : currentScaled - remainder;
  return clampTo(nextScaled / scale, min, max);
}

export function initialState(context: NumberFieldContext): NumberFieldState {
  const locale = canonicalLocale(context.locale ?? DEFAULT_LOCALE);
  const min = context.min != null && Number.isFinite(context.min) ? context.min : null;
  const max = context.max != null && Number.isFinite(context.max) ? context.max : null;
  const step =
    context.step != null && Number.isFinite(context.step) && context.step > 0 ? context.step : 1;
  const value = context.value != null && Number.isFinite(context.value) ? context.value : null;
  return {
    value,
    inputValue: formatNumber(value, locale),
    committedValue: value,
    locale,
    min,
    max,
    step,
    disabled: context.disabled ?? false,
    readOnly: context.readOnly ?? false,
    required: context.required ?? false,
    changeOnWheel: context.changeOnWheel ?? false,
    id: context.id ?? `ds-number-field-${++idCounter}`,
  };
}

export const inputId = (baseId: string) => `${baseId}-input`;
export const labelId = (baseId: string) => `${baseId}-label`;
export const incrementId = (baseId: string) => `${baseId}-increment`;
export const decrementId = (baseId: string) => `${baseId}-decrement`;
