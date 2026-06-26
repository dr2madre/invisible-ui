import { button as core } from "@design-system/core";
import type { Action } from "svelte/action";
import { derived, writable, type Readable } from "svelte/store";
import { createRootAction } from "../internal/connect";
import { normalizeProps } from "../normalize";

export type ButtonApi = core.ButtonApi;
export type ButtonState = core.ButtonState;
export type ButtonContext = core.ButtonContext;
export type ButtonVariant = core.ButtonVariant;

export interface CreateButtonOptions extends ButtonContext {
  /** Called when the button is activated (click, or Enter/Space when emulated). */
  onPress?: (event: Event) => void;
  /** Native `<button>` type. Defaults to `"button"`. */
  type?: "button" | "submit" | "reset";
  /** Set `false` when rendering a non-native element (`<a>`, `<div>`, …). */
  nativeButton?: boolean;
}

export interface CreateButton {
  /** Reactive resolved state (`{ disabled }`). */
  state: Readable<ButtonState>;
  /** Reactive connected API (prop getters). */
  api: Readable<ButtonApi>;
  /** Enable/disable the button at runtime. */
  setDisabled: (value: boolean) => void;
  /** Change the semantic variant at runtime. */
  setVariant: (value: ButtonVariant) => void;
  /** Svelte action for the root element: `<button use:rootAction>`. */
  rootAction: Action<HTMLElement>;
}

/**
 * Create a headless button. Defaults to native `<button>` semantics; set
 * `nativeButton: false` to emulate a button on another element (role,
 * focusability and Enter/Space activation). Behaviour and accessibility live
 * in `@design-system/core`.
 */
export function createButton(options: CreateButtonOptions = {}): CreateButton {
  const { onPress, type, nativeButton } = options;
  const state = writable<ButtonState>(core.initialState(options));

  const setDisabled = (value: boolean) => {
    state.update((current) =>
      current.disabled === value ? current : { ...current, disabled: value },
    );
  };

  const setVariant = (value: ButtonVariant) => {
    state.update((current) =>
      current.variant === value ? current : { ...current, variant: value },
    );
  };

  const api = derived(state, ($state) =>
    core.connect({
      state: $state,
      onPress,
      type,
      nativeButton,
      normalize: normalizeProps,
    }),
  );

  return { state, api, setDisabled, setVariant, rootAction: createRootAction(api) };
}
