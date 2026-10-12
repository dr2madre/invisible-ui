import { foldArabicDigits } from "../internal/digits";
import type { Dir } from "../i18n/locale";
import type { PinInputContext, PinInputState, PinInputType } from "./types";

let idCounter = 0;

/** Split a string into a fixed-length array of single characters. */
export const splitValue = (value: string, length: number): string[] =>
  Array.from({ length }, (_, i) => value[i] ?? "");

/**
 * Keep a single character only if it is allowed for the input type. Arabic-Indic
 * and Persian digits are allowed and come back as ASCII digits, so the value
 * reported is always ASCII.
 */
export function sanitizeChar(char: string, type: PinInputType): string {
  if (!char) return "";
  const folded = foldArabicDigits(char);
  const ok = type === "numeric" ? /^[0-9]$/.test(folded) : /^[0-9a-z]$/i.test(folded);
  return ok ? folded : "";
}

/**
 * The cell a navigation key moves the focus to from cell `index`, or null for
 * any other key. The arrows follow the cells as they are laid out: in a
 * right-to-left layout the first cell is on the right, so ArrowLeft moves to
 * the next cell. Home and End go to the first and the last cell. At an end,
 * the arrow keeps the focus where it is.
 */
export function keyTarget(
  key: string,
  index: number,
  length: number,
  direction: Dir = "ltr",
): number | null {
  if (key === "Home") return 0;
  if (key === "End") return length - 1;
  const step = key === "ArrowRight" ? 1 : key === "ArrowLeft" ? -1 : 0;
  if (!step) return null;
  const target = index + (direction === "rtl" ? -step : step);
  return Math.min(Math.max(target, 0), length - 1);
}

/** Build the initial state from user context. */
export function initialState(context: PinInputContext = {}): PinInputState {
  const length = context.length ?? 6;
  return {
    values: splitValue(context.value ?? "", length),
    length,
    type: context.type ?? "numeric",
    mask: context.mask ?? false,
    disabled: context.disabled ?? false,
    id: context.id ?? `ds-pin-input-${++idCounter}`,
  };
}

/** The combined value across all cells. */
export const value = (state: PinInputState): string => state.values.join("");

/** Whether every cell is filled. */
export const isComplete = (state: PinInputState): boolean =>
  state.values.every((v) => v !== "") && state.values.length === state.length;
