import { menu as core } from "@design-system/core";
import { tick } from "svelte";
import type { Action } from "svelte/action";
import { derived, get, writable, type Readable } from "svelte/store";
import { createItemAction, createPropsAction } from "../internal/connect";
import { onOutsidePointerDown } from "../internal/dismiss";
import { attachFloating } from "../internal/floating";
import { ignoreGhostClicks } from "../internal/ghost-click";
import { stableId } from "../internal/stable-id";
import { normalizeProps } from "../normalize";

export type MenuItem = core.MenuItem;
export type MenuEntry = core.MenuEntry;
export type MenuGroup = core.MenuGroup;
export type MenuSeparator = core.MenuSeparator;
export type MenuItemKind = core.MenuItemKind;
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
  /** Reflect controlled items without reporting a change. */
  syncItems: (items: MenuEntry[]) => void;
  /** Reflect the controlled disabled state. */
  syncDisabled: (disabled: boolean) => void;
}

const TYPEAHEAD_RESET = 500;

/**
 * Create a headless dropdown menu (WAI-ARIA menu button). Behaviour and
 * accessibility live in `@design-system/core`; this adapter owns the DOM
 * concerns: popup positioning (`@floating-ui/dom`, flip/shift), moving DOM
 * focus into the menu (roving — the active item is focused), returning focus to
 * the trigger on close, typeahead, and close-on-outside-pointer.
 */
export function createDropdownMenu(context: MenuContext): CreateDropdownMenu {
  const state = writable<MenuState>(
    core.initialState({ ...context, id: context.id ?? stableId("ds-menu") }),
  );

  const setOpen = (open: boolean) => {
    const current = get(state);
    if (current.open === open) return;
    state.set({ ...current, open });
    context.onOpenChange?.(open);
  };

  const setActiveValue = (activeValue: string | null) =>
    state.update((current) =>
      current.activeValue === activeValue ? current : { ...current, activeValue },
    );

  // Reflect controlled props without reporting a change, so keyboard
  // navigation and typeahead walk the items the template renders.
  const syncItems = (items: MenuEntry[]) =>
    state.update((current) => (current.items === items ? current : { ...current, items }));

  const syncDisabled = (disabled: boolean) =>
    state.update((current) => (current.disabled === disabled ? current : { ...current, disabled }));

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

  const itemEl = (value: string | null) =>
    value && menuEl
      ? menuEl.querySelector<HTMLElement>(`[data-value="${CSS.escape(value)}"]`)
      : null;

  const close = () => {
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

    let stopFloating: (() => void) | null = null;
    let stopDismiss: (() => void) | null = null;
    let buffer = "";
    let timer: ReturnType<typeof setTimeout> | undefined;

    const teardown = () => {
      stopFloating?.();
      stopFloating = null;
      stopDismiss?.();
      stopDismiss = null;
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
          stopFloating = attachFloating(triggerEl, node, { sameWidth: true });
          stopDismiss = onOutsidePointerDown([triggerEl, node], close);
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

  const itemAction: Action<HTMLElement, string> = createItemAction(api, (a, value: string) =>
    a.getItemProps(value),
  );

  return {
    state,
    api,
    open: derived(state, ($state) => $state.open),
    triggerAction,
    menuAction,
    itemAction,
    syncItems,
    syncDisabled,
  };
}
