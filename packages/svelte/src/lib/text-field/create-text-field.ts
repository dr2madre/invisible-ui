import { textField as core } from "@design-system/core";
import type { Action } from "svelte/action";
import { derived, writable, type Readable } from "svelte/store";
import { createPropsAction } from "../internal/connect";
import { normalizeProps } from "../normalize";

export type TextFieldApi = core.TextFieldApi;
export type TextFieldState = core.TextFieldState;
export type TextFieldContext = core.TextFieldContext;

/** The flags an adapter can update reactively after creation. */
export type TextFieldFlags = Partial<
  Pick<TextFieldState, "disabled" | "readOnly" | "required" | "invalid" | "hasDescription">
>;

export interface CreateTextField {
  /** Reactive resolved state. */
  state: Readable<TextFieldState>;
  /** Reactive connected API (prop bags for each part). */
  api: Readable<TextFieldApi>;
  /** The current value. */
  value: Readable<string>;
  /** Imperatively set the value (ignored when disabled or read-only). */
  setValue: (value: string) => void;
  /** Merge new state flags (disabled, invalid, …) — keeps props reactive. */
  setFlags: (flags: TextFieldFlags) => void;
  /** Svelte action for the `<label>`: `<label use:labelAction>`. */
  labelAction: Action<HTMLElement>;
  /** Svelte action for the control: `<input use:controlAction>`. */
  controlAction: Action<HTMLElement>;
  /** Svelte action for the description: `<p use:descriptionAction>`. */
  descriptionAction: Action<HTMLElement>;
  /** Svelte action for the error message: `<p use:errorAction>`. */
  errorAction: Action<HTMLElement>;
}

/**
 * Create a headless text field. Behaviour and accessibility (label/control
 * association, `aria-describedby`, `aria-invalid`, state flags) live in
 * `@design-system/core`; this adapter wires the state to a Svelte store and
 * applies each part's connected props via an action. Typing is left to the
 * native control — bind the value in the markup and report it through
 * `onValueChange` (or `setValue`).
 */
export function createTextField(context: TextFieldContext = {}): CreateTextField {
  const state = writable<TextFieldState>(core.initialState(context));

  const setValue = (value: string) => {
    state.update((current) => {
      if (current.disabled || current.readOnly || current.value === value) return current;
      context.onValueChange?.(value);
      return { ...current, value };
    });
  };

  const setFlags = (flags: TextFieldFlags) => state.update((current) => ({ ...current, ...flags }));

  const api = derived(state, ($state) =>
    core.connect({ state: $state, setValue, normalize: normalizeProps }),
  );

  return {
    state,
    api,
    value: derived(state, ($state) => $state.value),
    setValue,
    setFlags,
    labelAction: createPropsAction(api, (a) => a.labelProps),
    controlAction: createPropsAction(api, (a) => a.controlProps),
    descriptionAction: createPropsAction(api, (a) => a.descriptionProps),
    errorAction: createPropsAction(api, (a) => a.errorProps),
  };
}
