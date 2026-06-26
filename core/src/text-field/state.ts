import type { TextFieldContext, TextFieldState } from "./types";

let idCounter = 0;

/** Build the initial state from user context. */
export function initialState(context: TextFieldContext = {}): TextFieldState {
  return {
    value: context.value ?? "",
    disabled: context.disabled ?? false,
    readOnly: context.readOnly ?? false,
    required: context.required ?? false,
    invalid: context.invalid ?? false,
    hasDescription: context.hasDescription ?? false,
    id: context.id ?? `ds-field-${++idCounter}`,
  };
}

/** Id of the label element for a base id. */
export const labelId = (baseId: string) => `${baseId}-label`;

/** Id of the control (input / textarea) for a base id. */
export const controlId = (baseId: string) => `${baseId}-control`;

/** Id of the description / hint element for a base id. */
export const descriptionId = (baseId: string) => `${baseId}-description`;

/** Id of the error message element for a base id. */
export const errorId = (baseId: string) => `${baseId}-error`;
