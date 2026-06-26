import {
  firstEnabled,
  lastEnabled,
  nextEnabled,
  prevEnabled,
  type CollectionItem,
} from "../internal/collection";
import { identityNormalize, type ElementProps, type Normalize } from "../types";
import { clampPage, pageItems } from "./state";
import type { PageItem, PaginationState } from "./types";

/** The public, framework-agnostic API for a connected pagination control. */
export interface PaginationApi {
  /** Current page (1-based). */
  page: number;
  pageCount: number;
  /** Rendered items (page numbers and ellipsis gaps). */
  items: PageItem[];
  /** Go to a page (clamped; ignored while disabled). */
  setPage(page: number): void;
  /** Props for the container (render on a `<nav>`). */
  rootProps: ElementProps;
  /** Props for the "previous page" button. */
  getPrevProps(): ElementProps;
  /** Props for the "next page" button. */
  getNextProps(): ElementProps;
  /** Props for a numbered page button. */
  getPageProps(page: number): ElementProps;
}

export interface ConnectOptions {
  /** Current resolved state. */
  state: PaginationState;
  /** Request a new page; the adapter owns how state updates. */
  setPage: (page: number) => void;
  /** Move DOM focus to the control with the given value (adapter-provided). */
  focus?: (value: string) => void;
  /** Framework adapter's prop normaliser. Defaults to identity. */
  normalize?: Normalize;
}

const PREV = "prev";
const NEXT = "next";

/**
 * Connect pagination state to prop getters. The controls (previous, the visible
 * page numbers, next) form a single-select roving collection — like Tabs: one
 * tab stop (the current page), arrow keys move focus (Home/End jump to the
 * ends), activation is via click/Enter/Space. The current page is marked
 * `aria-current="page"`.
 */
export function connect({
  state,
  setPage,
  focus,
  normalize = identityNormalize,
}: ConnectOptions): PaginationApi {
  const { page, pageCount, disabled } = state;
  const items = pageItems(state);

  const set = (target: number) => {
    if (disabled) return;
    const clamped = clampPage(target, pageCount);
    if (clamped !== page) setPage(clamped);
  };

  // Ordered focusable controls for the roving tabindex.
  const navItems: CollectionItem[] = [
    { value: PREV, disabled: disabled || page <= 1 },
    ...items
      .filter((i): i is number => typeof i === "number")
      .map((p) => ({ value: String(p), disabled })),
    { value: NEXT, disabled: disabled || page >= pageCount },
  ];
  const tabStop = navItems.find((i) => i.value === String(page))?.value ?? firstEnabled(navItems);

  const moveFocus = (target: string | null) => {
    if (target != null) focus?.(target);
  };

  const navKeyDown = (value: string) => (event: Event) => {
    const key = (event as KeyboardEvent).key;
    switch (key) {
      case "ArrowRight":
      case "ArrowDown":
        event.preventDefault();
        moveFocus(nextEnabled(navItems, value));
        break;
      case "ArrowLeft":
      case "ArrowUp":
        event.preventDefault();
        moveFocus(prevEnabled(navItems, value));
        break;
      case "Home":
        event.preventDefault();
        moveFocus(firstEnabled(navItems));
        break;
      case "End":
        event.preventDefault();
        moveFocus(lastEnabled(navItems));
        break;
    }
  };

  const controlProps = (value: string, itemDisabled: boolean, onActivate: () => void) =>
    normalize({
      type: "button",
      disabled: itemDisabled || undefined,
      tabindex: itemDisabled ? undefined : value === tabStop ? 0 : -1,
      "data-value": value,
      "data-disabled": itemDisabled ? "" : undefined,
      onClick: onActivate,
      onKeyDown: navKeyDown(value),
    });

  return {
    page,
    pageCount,
    items,
    setPage: set,
    rootProps: normalize({
      "data-disabled": disabled ? "" : undefined,
    }),
    getPrevProps: () => controlProps(PREV, disabled || page <= 1, () => set(page - 1)),
    getNextProps: () => controlProps(NEXT, disabled || page >= pageCount, () => set(page + 1)),
    getPageProps: (p: number) => {
      const current = p === page;
      return {
        ...controlProps(String(p), disabled, () => set(p)),
        "aria-current": current ? "page" : undefined,
        "data-selected": current ? "" : undefined,
      };
    },
  };
}
