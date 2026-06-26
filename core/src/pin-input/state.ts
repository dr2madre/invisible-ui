import type { PinInputContext, PinInputState, PinInputType } from "./types";

let idCounter = 0;

/** Split a string into a fixed-length array of single characters. */
export const splitValue = (value: string, length: number): string[] =>
  Array.from({ length }, (_, i) => value[i] ?? "");

/** Keep a single character only if it is allowed for the input type. */
export function sanitizeChar(char: string, type: PinInputType): string {
  if (!char) return "";
  const ok = type === "numeric" ? /[0-9]/.test(char) : /[0-9a-z]/i.test(char);
  return ok ? char : "";
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
