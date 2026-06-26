import { menu as core } from "@design-system/core";
import {
  computePosition,
  flip,
  offset as offsetMiddleware,
  shift,
  type Placement,
} from "@floating-ui/dom";
import { tick } from "svelte";
import type { Action } from "svelte/action";
import { derived, get, writable, type Readable } from "svelte/store";
import { createPropsAction } from "../internal/connect";
import { normalizeProps } from "../normalize";

export type MenuItem = core.MenuItem;
export type MenuApi = core.MenuApi;
export type MenuState = core.MenuState;

export interface ContextMenuContext {
  items: core.MenuItem[];
  disabled?: boolean;
  id?: string;
  /** Called with the chosen item's value. */
  onSelect?: (value: string) => void;
  /** Called whenever the open state changes. */
  onOpenChange?: (open: boolean) => void;
  /** Preferred placement relative to the pointer. Default `"right-start"`. */
  placement?: Placement;
}

export interface CreateContextMenu {
  state: Readable<MenuState>;
  api: Readable<MenuApi>;
  /** Whether the menu is open. */
  open: Readable<boolean>;
  /**
   * Svelte action for the region that opens the menu on `contextmenu`
   * (right-click or the keyboard menu key): `<div use:triggerAction>`.
   */
  triggerAction: Action<HTMLElement>;
  /** Svelte action for the menu popup: `<div use:menuAction>`. */
  menuAction: Action<HTMLElement>;
  /** Svelte action for a menu item: `<button use:itemAction={value}>`. */
  itemAction: Action<HTMLElement, string>;
}

const TYPEAHEAD_RESET = 500;

/**
 * Create a headless context menu — a `role="menu"` opened by right-click (or the
 * keyboard context-menu key) at the pointer. It reuses the framework-agnostic
 * `menu` primitive in `@design-system/core` for all behaviour and ARIA (roving
 * focus, arrow/Home/End navigation, Enter/click activation, Escape/Tab close);
 * this adapter owns the DOM concerns specific to a context menu: positioning the
 * popup against a zero-size virtual anchor at the pointer (`@floating-ui/dom`,
 * flip/shift), close-on-outside-pointer, typeahead, and restoring focus on close.
 *
 * Unlike Dropdown Menu there is no trigger button: the menu is summoned from a
 * region, so the popup is labelled with an `aria-label` (supplied by the styled
 * wrapper) rather than `aria-labelledby`.
 */
export function createContextMenu(context: ContextMenuContext): CreateContextMenu {
  const state = writable<MenuState>(core.initialState(context));
  const placement: Placement = context.placement ?? "right-start";

  const setOpen = (open: boolean) =>
    state.update((current) => {
      if (current.open === open) return current;
      context.onOpenChange?.(open);
      return { ...current, open };
    });

  const setActiveValue = (activeValue: string | null) =>
    state.update((current) =>
      current.activeValue === activeValue ? current : { ...current, activeValue },
    );

  const api = derived(state, ($state) =>
    core.connect({
      state: $state,
      setOpen,
      setActiveValue,
      onSelect: context.onSelect,
      normalize: normalizeProps,
    }),
  );

  let menuEl: HTMLElement | null = null;
  // Viewport coordinates of the last open request: the pointer, or the focused
  // trigger's top-left when summoned from the keyboard. The popup is positioned
  // against a zero-size virtual anchor at this point.
  let point = { x: 0, y: 0 };

  const reposition = () => {
    if (!menuEl) return;
    const anchor = {
      getBoundingClientRect: () => ({
        x: point.x,
        y: point.y,
        width: 0,
        height: 0,
        top: point.y,
        left: point.x,
        right: point.x,
        bottom: point.y,
      }),
    };
    computePosition(anchor, menuEl, {
      placement,
      strategy: "fixed",
      middleware: [offsetMiddleware(2), flip({ padding: 8 }), shift({ padding: 8 })],
    }).then(({ x, y }) => {
      if (!menuEl) return;
      menuEl.style.left = `${x}px`;
      menuEl.style.top = `${y}px`;
    });
  };

  const itemEl = (value: string | null) =>
    value && menuEl
      ? menuEl.querySelector<HTMLElement>(`[data-value="${CSS.escape(value)}"]`)
      : null;

  const onOutsidePointer = (event: Event) => {
    if (menuEl?.contains(event.target as Node)) return;
    setOpen(false);
    setActiveValue(null);
  };

  /** Open (or re-summon) the menu at a viewport point, focusing the first item. */
  const openAt = (x: number, y: number) => {
    const current = get(state);
    if (current.disabled) return;
    point = { x, y };
    setActiveValue(core.firstEnabled(current.items));
    if (current.open) reposition();
    else setOpen(true);
  };

  const triggerAction: Action<HTMLElement> = (node) => {
    const onContextMenu = (event: MouseEvent) => {
      event.preventDefault();
      // The keyboard menu key / Shift+F10 fire `contextmenu` with no pointer, so
      // fall back to the trigger's top-left corner.
      if (event.clientX === 0 && event.clientY === 0) {
        const rect = node.getBoundingClientRect();
        openAt(rect.left, rect.top);
      } else {
        openAt(event.clientX, event.clientY);
      }
    };
    node.addEventListener("contextmenu", onContextMenu);
    return {
      destroy() {
        node.removeEventListener("contextmenu", onContextMenu);
      },
    };
  };

  // The popup is rendered only while open, so this action's lifecycle tracks the
  // open state: setup runs when the menu opens, destroy when it closes.
  const menuAction: Action<HTMLElement> = (node) => {
    menuEl = node;
    // Capture the element to restore focus to — taken before focus moves into
    // the menu (the popup mounts before the roving focus tick runs).
    const previouslyFocused = document.activeElement as HTMLElement | null;

    // A context menu has no labelling trigger; drop the dangling
    // `aria-labelledby` from core — the styled wrapper supplies `aria-label`.
    const base = createPropsAction(api, (a) => {
      const { ["aria-labelledby"]: _omit, ...rest } = a.menuProps;
      return rest;
    })(node);

    let buffer = "";
    let timer: ReturnType<typeof setTimeout> | undefined;

    // Typeahead while the menu is open.
    const onKeyDown = (event: KeyboardEvent) => {
      const printable =
        event.key.length === 1 &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        /\S/.test(event.key);
      if (!printable) return;
      buffer += event.key;
      clearTimeout(timer);
      timer = setTimeout(() => (buffer = ""), TYPEAHEAD_RESET);
      const current = get(state);
      const match = core.matchItem(current.items, buffer, current.activeValue);
      if (match) setActiveValue(match);
    };
    node.addEventListener("keydown", onKeyDown);

    // The anchor is a fixed viewport point, so a single positioning pass is
    // enough (no autoUpdate — the menu closes on scroll/outside press).
    reposition();
    document.addEventListener("pointerdown", onOutsidePointer, true);

    // Move DOM focus to the active item (roving) on open and as it changes.
    const unsubscribe = state.subscribe(($state) => {
      if (!$state.open) return;
      const target = $state.activeValue;
      tick().then(() => itemEl(target)?.focus());
    });

    return {
      destroy() {
        unsubscribe();
        document.removeEventListener("pointerdown", onOutsidePointer, true);
        node.removeEventListener("keydown", onKeyDown);
        clearTimeout(timer);
        if (menuEl === node) menuEl = null;
        base?.destroy?.();
        // Return focus to wherever it was before the menu opened.
        if (previouslyFocused?.isConnected) previouslyFocused.focus();
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
    open: derived(state, ($state) => $state.open),
    triggerAction,
    menuAction,
    itemAction,
  };
}
