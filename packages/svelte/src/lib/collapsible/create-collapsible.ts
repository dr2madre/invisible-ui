import { collapsible as core } from "@design-system/core";
import type { Action } from "svelte/action";
import { derived, get, writable, type Readable } from "svelte/store";
import { createPropsAction } from "../internal/connect";
import { stableId } from "../internal/stable-id";
import { normalizeProps } from "../normalize";

export type CollapsibleApi = core.CollapsibleApi;
export type CollapsibleState = core.CollapsibleState;
export type CollapsibleContext = core.CollapsibleContext;

export interface CreateCollapsible {
  /** Reactive resolved state. */
  state: Readable<CollapsibleState>;
  /** Reactive connected API. */
  api: Readable<CollapsibleApi>;
  /** Whether the content is expanded. */
  open: Readable<boolean>;
  /** Set the open state (ignored while disabled). */
  setOpen: (open: boolean) => void;
  /** Reflect a controlled `open` prop without reporting a change. */
  syncOpen: (open: boolean) => void;
  /** Toggle the open state (ignored while disabled). */
  toggle: () => void;
  /** Svelte action for the collapsible container: `<div use:rootAction>`. */
  rootAction: Action<HTMLElement>;
  /** Svelte action for the trigger button: `<button use:triggerAction>`. */
  triggerAction: Action<HTMLElement>;
  /** Svelte action for the content: `<div use:contentAction>`. */
  contentAction: Action<HTMLElement>;
}

/**
 * Create a headless collapsible (WAI-ARIA disclosure pattern): a single trigger
 * button that shows or hides one content region. Behaviour and accessibility
 * live in `@design-system/core`; this adapter wires state to a Svelte store and
 * applies the connected props via actions.
 */
export function createCollapsible(context: CollapsibleContext = {}): CreateCollapsible {
  const state = writable<CollapsibleState>(
    core.initialState({ ...context, id: context.id ?? stableId("ds-collapsible") }),
  );

  const setOpen = (next: boolean) => {
    state.update((current) => {
      if (current.open === next || current.disabled) return current;
      context.onOpenChange?.(next);
      return { ...current, open: next };
    });
  };

  // Reflect a controlled `open` prop without reporting a change: opening it
  // from the outside is not the user asking for it.
  const syncOpen = (open: boolean) =>
    state.update((current) => (current.open === open ? current : { ...current, open }));

  const api = derived(state, ($state) =>
    core.connect({ state: $state, setOpen, normalize: normalizeProps }),
  );

  return {
    state,
    api,
    open: derived(state, ($state) => $state.open),
    setOpen,
    syncOpen,
    toggle: () => get(api).toggle(),
    rootAction: createPropsAction(api, (a) => a.rootProps),
    triggerAction: createPropsAction(api, (a) => a.triggerProps),
    contentAction: createPropsAction(api, (a) => a.contentProps),
  };
}
