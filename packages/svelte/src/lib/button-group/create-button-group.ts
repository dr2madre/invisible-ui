import { buttonGroup as core } from "@design-system/core";
import type { Action } from "svelte/action";
import { derived, writable, type Readable } from "svelte/store";
import { createPropsAction } from "../internal/connect";
import { normalizeProps } from "../normalize";

export type Orientation = core.Orientation;
export type ButtonGroupApi = core.ButtonGroupApi;
export type ButtonGroupState = core.ButtonGroupState;
export type ButtonGroupContext = core.ButtonGroupContext;

export interface CreateButtonGroup {
  /** Reactive resolved state. */
  state: Readable<ButtonGroupState>;
  /** Reactive connected API. */
  api: Readable<ButtonGroupApi>;
  /** Merge new state (orientation, label) — keeps props reactive. */
  setState: (partial: Partial<ButtonGroupState>) => void;
  /** Svelte action for the group container: `<div use:rootAction>`. */
  rootAction: Action<HTMLElement>;
}

/**
 * Create a headless button group. Behaviour and accessibility (the labelled
 * `role="group"` container and its orientation) live in `@design-system/core`;
 * this adapter wires the state to a Svelte store and applies the group props
 * via an action. The buttons inside stay independent — the group carries no
 * selection.
 */
export function createButtonGroup(context: ButtonGroupContext = {}): CreateButtonGroup {
  const state = writable<ButtonGroupState>(core.initialState(context));

  const setState = (partial: Partial<ButtonGroupState>) =>
    state.update((current) => ({ ...current, ...partial }));

  const api = derived(state, ($state) =>
    core.connect({ state: $state, normalize: normalizeProps }),
  );

  return {
    state,
    api,
    setState,
    rootAction: createPropsAction(api, (a) => a.groupProps),
  };
}
