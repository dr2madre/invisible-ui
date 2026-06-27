import { menu as core } from "@design-system/core";
import { autoUpdate, computePosition, flip, offset, shift, type Placement } from "@floating-ui/dom";
import { tick } from "svelte";
import type { Action } from "svelte/action";
import { derived, get, writable, type Readable } from "svelte/store";
import { createPropsAction } from "../internal/connect";
import { ignoreGhostClicks } from "../internal/ghost-click";
import { normalizeProps } from "../normalize";

export type MenuItem = core.MenuItem;
export type MenuApi = core.MenuApi;
export type MenuState = core.MenuState;
export type MenuContext = core.MenuContext;

export interface CreateDropdownMenu {
  state: Readable<MenuState>;
  api: Readable<MenuApi>;
  open: Readable<boolean>;
  /** Svelte action for the trigger: `<button use:triggerAction>`. */
  triggerAction: Action<HTMLElement>;
  /** Svelte action for the menu popup: `<div use:menuAction>`. */
  menuAction: Action<HTMLElement>;
  /** Svelte action for a menu item: `<button use:itemAction={value}>`. */
  itemAction: Action<HTMLElement, string>;
}

const TYPEAHEAD_RESET = 500;
const placement: Placement = "bottom-start";

/**
 * Create a headless dropdown menu (WAI-ARIA menu button). Behaviour and
 * accessibility live in `@design-system/core`; this adapter owns the DOM
 * concerns: popup positioning (`@floating-ui/dom`, flip/shift), moving DOM
 * focus into the menu (roving — the active item is focused), returning focus to
 * the trigger on close, typeahead, and close-on-outside-pointer.
 */
export function createDropdownMenu(context: MenuContext): CreateDropdownMenu {
  const state = writable<MenuState>(core.initialState(context));

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

  let triggerEl: HTMLElement | null = null;
  let menuEl: HTMLElement | null = null;

  const reposition = () => {
    if (!triggerEl || !menuEl) return;
    computePosition(triggerEl, menuEl, {
      placement,
      strategy: "fixed",
      middleware: [offset(4), flip({ padding: 8 }), shift({ padding: 8 })],
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
    const target = event.target as Node;
    if (triggerEl?.contains(target) || menuEl?.contains(target)) return;
    setOpen(false);
    setActiveValue(null);
  };

  const triggerAction: Action<HTMLElement> = (node) => {
    triggerEl = node;
    const base = createPropsAction(api, (a) => a.triggerProps)(node);
    // Drop iOS's synthesized duplicate click so the menu doesn't toggle twice.
    const stopGhost = ignoreGhostClicks(node);
    return {
      destroy() {
        stopGhost();
        if (triggerEl === node) triggerEl = null;
        base?.destroy?.();
      },
    };
  };

  const menuAction: Action<HTMLElement> = (node) => {
    menuEl = node;
    const base = createPropsAction(api, (a) => a.menuProps)(node);

    let stopAutoUpdate: (() => void) | null = null;
    let buffer = "";
    let timer: ReturnType<typeof setTimeout> | undefined;

    const teardown = () => {
      stopAutoUpdate?.();
      stopAutoUpdate = null;
      document.removeEventListener("pointerdown", onOutsidePointer, true);
    };

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

    let wasOpen = false;
    const unsubscribe = state.subscribe(($state) => {
      if ($state.open && !wasOpen) {
        if (triggerEl) {
          node.style.minWidth = `${triggerEl.offsetWidth}px`;
          stopAutoUpdate =
            typeof ResizeObserver !== "undefined"
              ? autoUpdate(triggerEl, node, reposition)
              : (reposition(), () => {});
          document.addEventListener("pointerdown", onOutsidePointer, true);
        }
      } else if (!$state.open && wasOpen) {
        teardown();
        // Return focus to the trigger when the menu closes.
        triggerEl?.focus();
      }
      // Move DOM focus to the active item (roving focus) once the DOM (the
      // popup's display + items) has updated. `tick` is a microtask, so it runs
      // before the next user keystroke — keeping the menu, not the trigger, the
      // keyboard target.
      if ($state.open) {
        const target = $state.activeValue;
        tick().then(() => itemEl(target)?.focus());
      }
      wasOpen = $state.open;
    });

    return {
      destroy() {
        unsubscribe();
        teardown();
        node.removeEventListener("keydown", onKeyDown);
        clearTimeout(timer);
        if (menuEl === node) menuEl = null;
        base?.destroy?.();
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
