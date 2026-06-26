import { field as core } from "@design-system/core";
import { derived, writable, type Readable } from "svelte/store";
import { normalizeProps } from "../normalize";

export type FieldApi = core.FieldApi;
export type FieldState = core.FieldState;
export type FieldContext = core.FieldContext;

export interface CreateField {
  /** Reactive resolved state. */
  state: Readable<FieldState>;
  /** Reactive connected API (ids + prop bags for each part). */
  api: Readable<FieldApi>;
  /** Merge a partial state (e.g. when error/required change reactively). */
  update: (partial: Partial<FieldState>) => void;
}

/**
 * Create a headless field that wires together a label, control, description and
 * error message. Behaviour and accessibility (id linking, `aria-describedby`,
 * `aria-invalid` / `aria-required`) live in `@design-system/core`; this adapter
 * exposes the connected prop bags as a reactive store for the styled component
 * to spread onto each part.
 */
export function createField(context: core.FieldContext = {}): CreateField {
  const state = writable<FieldState>(core.initialState(context));

  const api = derived(state, ($state) =>
    core.connect({ state: $state, normalize: normalizeProps }),
  );

  return {
    state,
    api,
    update: (partial) => state.update((current) => ({ ...current, ...partial })),
  };
}
