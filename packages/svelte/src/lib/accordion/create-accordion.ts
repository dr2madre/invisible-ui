import { accordion as core } from "@design-system/core";
import type { Action } from "svelte/action";
import { derived, get, writable, type Readable } from "svelte/store";
import { createPropsAction } from "../internal/connect";
import { normalizeProps } from "../normalize";

export type AccordionType = core.AccordionType;
export type AccordionItem = core.AccordionItem;
export type AccordionApi = core.AccordionApi;
export type AccordionState = core.AccordionState;
export type AccordionContext = core.AccordionContext;

export interface CreateAccordion {
  /** Reactive resolved state. */
  state: Readable<AccordionState>;
  /** Reactive connected API. */
  api: Readable<AccordionApi>;
  /** The expanded item values. */
  value: Readable<string[]>;
  /** Replace the expanded set. */
  setValue: (value: string[]) => void;
  /** Toggle a single item open/closed (ignored when disabled). */
  toggle: (value: string) => void;
  /** Svelte action for the accordion container: `<div use:rootAction>`. */
  rootAction: Action<HTMLElement>;
  /** Svelte action for an item wrapper: `<div use:itemAction={value}>`. */
  itemAction: Action<HTMLElement, string>;
  /** Svelte action for a trigger button: `<button use:triggerAction={value}>`. */
  triggerAction: Action<HTMLElement, string>;
  /** Svelte action for a panel: `<div use:panelAction={value}>`. */
  panelAction: Action<HTMLElement, string>;
}

const sameSet = (a: string[], b: string[]) =>
  a.length === b.length && a.every((v) => b.includes(v));

/**
 * Create a headless accordion (WAI-ARIA accordion pattern) supporting single or
 * multiple expansion, with arrow-key movement between headers. Behaviour and
 * accessibility live in `@design-system/core`; this adapter wires state to a
 * Svelte store, applies connected props via actions, and moves DOM focus.
 */
export function createAccordion(context: AccordionContext): CreateAccordion {
  const state = writable<AccordionState>(core.initialState(context));

  const setValue = (next: string[]) => {
    state.update((current) => {
      if (sameSet(current.value, next)) return current;
      context.onValueChange?.(next);
      return { ...current, value: next };
    });
  };

  // The container scopes focus movement between header buttons.
  let rootEl: HTMLElement | null = null;
  const focus = (value: string) => {
    const el = rootEl
      ? Array.from(rootEl.querySelectorAll<HTMLElement>("[data-value]")).find(
          (node) => node.dataset.value === value,
        )
      : null;
    el?.focus();
  };

  const api = derived(state, ($state) =>
    core.connect({ state: $state, setValue, focus, normalize: normalizeProps }),
  );

  const baseRootAction = createPropsAction(api, (a) => a.rootProps);
  const rootAction: Action<HTMLElement> = (node) => {
    rootEl = node;
    const handle = baseRootAction(node);
    return {
      destroy() {
        if (rootEl === node) rootEl = null;
        handle?.destroy?.();
      },
    };
  };

  const itemAction: Action<HTMLElement, string> = (node, value) => {
    const itemApi = derived(api, (a) => a.getItemProps(value as string));
    const handle = createPropsAction(itemApi, (p) => p)(node);
    return { destroy: () => handle?.destroy?.() };
  };

  const triggerAction: Action<HTMLElement, string> = (node, value) => {
    const triggerApi = derived(api, (a) => a.getTriggerProps(value as string));
    const handle = createPropsAction(triggerApi, (p) => p)(node);
    return { destroy: () => handle?.destroy?.() };
  };

  const panelAction: Action<HTMLElement, string> = (node, value) => {
    const panelApi = derived(api, (a) => a.getPanelProps(value as string));
    const handle = createPropsAction(panelApi, (p) => p)(node);
    return { destroy: () => handle?.destroy?.() };
  };

  return {
    state,
    api,
    value: derived(state, ($state) => $state.value),
    setValue,
    toggle: (value: string) => get(api).toggle(value),
    rootAction,
    itemAction,
    triggerAction,
    panelAction,
  };
}
