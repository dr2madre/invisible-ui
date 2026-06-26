import type { CheckboxGroupContext, CheckboxGroupState } from "./types";

/** Build the initial state from user context. */
export function initialState(context: CheckboxGroupContext): CheckboxGroupState {
  return {
    value: context.value ?? [],
    items: context.items,
    disabled: context.disabled ?? false,
  };
}

/** Pure helper: add `value` when absent, remove it when present. */
export function toggleValue(values: string[], value: string): string[] {
  return values.includes(value) ? values.filter((v) => v !== value) : [...values, value];
}
