import { radioGroup as core } from "@design-system/core";
import { derived, writable, type Readable } from "svelte/store";

export type Orientation = core.Orientation;
export type RadioItem = core.RadioItem;
export type RadioGroupState = core.RadioGroupState;
export type RadioGroupContext = core.RadioGroupContext;

let _uid = 0;

export interface CreateRadioGroup {
  /** Reactive resolved state. */
  state: Readable<RadioGroupState>;
  /** The selected value (or `null`). */
  value: Readable<string | null>;
  /** Imperatively select a value. */
  setValue: (value: string) => void;
  /** Shared form/group name applied to every radio input. */
  name: string;
}

/**
 * Create a headless single-select radio group backed by **native**
 * `<input type="radio">` items. The browser owns single selection, roving
 * tabindex, arrow-key navigation and form participation (the selected value is
 * submitted under the shared `name`); this adapter only owns the controlled
 * value. A `name` is generated when one isn't supplied so the radios group.
 */
export function createRadioGroup(context: RadioGroupContext): CreateRadioGroup {
  const name = context.name ?? `ds-radio-group-${++_uid}`;
  const state = writable<RadioGroupState>(core.initialState(context));

  const setValue = (value: string) => {
    state.update((current) => {
      if (current.value === value) return current;
      context.onValueChange?.(value);
      return { ...current, value };
    });
  };

  return {
    state,
    value: derived(state, ($state) => $state.value),
    setValue,
    name,
  };
}
