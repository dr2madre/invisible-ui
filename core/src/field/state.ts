import type { FieldContext, FieldState } from "./types";

let idCounter = 0;

/** Build the initial state from user context. */
export function initialState(context: FieldContext = {}): FieldState {
  return {
    id: context.id ?? `ds-field-${++idCounter}`,
    required: context.required ?? false,
    invalid: context.invalid ?? false,
    disabled: context.disabled ?? false,
    hasDescription: context.hasDescription ?? false,
    hasError: context.hasError ?? false,
  };
}

export const labelId = (baseId: string) => `${baseId}-label`;
export const controlId = (baseId: string) => `${baseId}-control`;
export const descriptionId = (baseId: string) => `${baseId}-description`;
export const errorId = (baseId: string) => `${baseId}-error`;
