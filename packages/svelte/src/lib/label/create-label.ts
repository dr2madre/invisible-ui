import { label as core } from "@design-system/core";
import type { Action } from "svelte/action";
import { derived, writable, type Readable } from "svelte/store";
import { createRootAction } from "../internal/connect";
import { normalizeProps } from "../normalize";

export type LabelApi = core.LabelApi;
export type LabelState = core.LabelState;
export type LabelContext = core.LabelContext;

export interface CreateLabel {
  /** Reactive resolved state. */
  state: Readable<LabelState>;
  /** Reactive connected API. */
  api: Readable<LabelApi>;
  /** Mirror the association after mount: the control a label names can change. */
  sync: (context: LabelContext) => void;
  /** Svelte action for the label element: `<label use:rootAction>`. */
  rootAction: Action<HTMLElement>;
}

/**
 * Create a headless label associated with a form control via `for`/`id`.
 * Behaviour lives in `@design-system/core` (association + prevent text
 * selection on double-click); this adapter applies the props via an action.
 */
export function createLabel(context: core.LabelContext = {}): CreateLabel {
  const state = writable<LabelState>(core.initialState(context));

  const api = derived(state, ($state) =>
    core.connect({ state: $state, normalize: normalizeProps }),
  );

  const sync = (next: core.LabelContext) =>
    state.update((current) => {
      const resolved = core.initialState(next);
      return resolved.for === current.for && resolved.id === current.id ? current : resolved;
    });

  return {
    state,
    api,
    sync,
    rootAction: createRootAction(api),
  };
}
