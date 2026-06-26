import { pagination as core } from "@design-system/core";
import type { Action } from "svelte/action";
import { derived, get, writable, type Readable } from "svelte/store";
import { createPropsAction } from "../internal/connect";
import { normalizeProps } from "../normalize";

export type PageItem = core.PageItem;
export type PaginationApi = core.PaginationApi;
export type PaginationState = core.PaginationState;
export type PaginationContext = core.PaginationContext;

export interface CreatePagination {
  /** Reactive resolved state. */
  state: Readable<PaginationState>;
  /** Reactive connected API. */
  api: Readable<PaginationApi>;
  /** Current page (1-based). */
  page: Readable<number>;
  /** Rendered items (page numbers and ellipsis gaps). */
  items: Readable<PageItem[]>;
  /** Go to a page (clamped; ignored while disabled). */
  setPage: (page: number) => void;
  /** Svelte action for the container: `<nav use:rootAction>`. */
  rootAction: Action<HTMLElement>;
  /** Svelte action for the previous-page button. */
  prevAction: Action<HTMLElement>;
  /** Svelte action for the next-page button. */
  nextAction: Action<HTMLElement>;
  /** Svelte action for a numbered page button: `<button use:pageAction={n}>`. */
  pageAction: Action<HTMLElement, number>;
}

/**
 * Create a headless pagination control: previous, the visible page numbers (with
 * ellipsis gaps), and next form a single-select roving collection (like Tabs).
 * Behaviour and accessibility live in `@design-system/core`; this adapter wires
 * state to a Svelte store, applies connected props via actions, and moves focus.
 */
export function createPagination(context: core.PaginationContext): CreatePagination {
  const state = writable<PaginationState>(core.initialState(context));

  const setPage = (next: number) => {
    state.update((current) => {
      if (current.page === next) return current;
      context.onPageChange?.(next);
      return { ...current, page: next };
    });
  };

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
    core.connect({ state: $state, setPage, focus, normalize: normalizeProps }),
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

  const prevAction = createPropsAction(api, (a) => a.getPrevProps());
  const nextAction = createPropsAction(api, (a) => a.getNextProps());

  const pageAction: Action<HTMLElement, number> = (node, page) => {
    const pageApi = derived(api, (a) => a.getPageProps(page as number));
    const handle = createPropsAction(pageApi, (p) => p)(node);
    return { destroy: () => handle?.destroy?.() };
  };

  return {
    state,
    api,
    page: derived(state, ($state) => $state.page),
    items: derived(api, ($api) => $api.items),
    setPage: (p: number) => get(api).setPage(p),
    rootAction,
    prevAction,
    nextAction,
    pageAction,
  };
}
