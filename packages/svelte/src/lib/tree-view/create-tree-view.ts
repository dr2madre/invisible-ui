import { treeView as core } from "@design-system/core";
import type { Action } from "svelte/action";
import { derived, get, writable, type Readable } from "svelte/store";
import { createPropsAction } from "../internal/connect";
import { normalizeProps } from "../normalize";

export type TreeNode = core.TreeNode;
export type TreeApi = core.TreeApi;
export type TreeState = core.TreeState;
export type TreeContext = core.TreeContext;
export type VisibleNode = core.VisibleNode;

export interface CreateTreeView {
  /** Reactive resolved state. */
  state: Readable<TreeState>;
  /** Reactive connected API. */
  api: Readable<TreeApi>;
  /** The currently-visible, flattened node list (for rendering). */
  visible: Readable<VisibleNode[]>;
  /** Expanded parent values. */
  expanded: Readable<string[]>;
  /** The selected value (or `null`). */
  selected: Readable<string | null>;
  /** Imperatively expand/collapse a parent. */
  toggle: (value: string) => void;
  /** Imperatively select a value. */
  select: (value: string) => void;
  /** Svelte action for the tree container: `<div use:rootAction>`. */
  rootAction: Action<HTMLElement>;
  /** Svelte action for a treeitem: `<div use:itemAction={value}>`. */
  itemAction: Action<HTMLElement, string>;
}

/**
 * Create a headless tree (WAI-ARIA tree pattern): single selection, roving
 * tabindex, expand/collapse and arrow-key navigation over the visible nodes.
 * The flattening + navigation logic lives in `@design-system/core`; this adapter
 * wires state to Svelte stores, applies the connected props via actions, and
 * moves DOM focus during navigation.
 */
export function createTreeView(context: TreeContext): CreateTreeView {
  const state = writable<TreeState>(core.initialState(context));

  const setExpanded = (expanded: string[]) => {
    state.update((current) => {
      context.onExpandedChange?.(expanded);
      return { ...current, expanded };
    });
  };

  const setSelected = (value: string) => {
    state.update((current) => {
      if (current.selected === value) return current;
      context.onSelectedChange?.(value);
      return { ...current, selected: value };
    });
  };

  const setFocused = (value: string) => {
    state.update((current) =>
      current.focused === value ? current : { ...current, focused: value },
    );
  };

  // The root element scopes focus movement during keyboard navigation.
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
    core.connect({
      state: $state,
      setExpanded,
      setSelected,
      setFocused,
      focus,
      normalize: normalizeProps,
    }),
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
    const handle = createPropsAction(itemApi, (props) => props)(node);
    return { destroy: () => handle?.destroy?.() };
  };

  return {
    state,
    api,
    visible: derived(state, ($state) => core.visibleNodes($state)),
    expanded: derived(state, ($state) => $state.expanded),
    selected: derived(state, ($state) => $state.selected),
    // Imperative helpers read the connected API's current value.
    toggle: (value: string) => get(api).toggle(value),
    select: (value: string) => get(api).select(value),
    rootAction,
    itemAction,
  };
}
