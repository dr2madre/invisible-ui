import { select as core } from "@design-system/core";
import { autoUpdate, computePosition, flip, offset, shift, type Placement } from "@floating-ui/dom";
import type { Action } from "svelte/action";
import { derived, get, writable, type Readable } from "svelte/store";
import { createPropsAction } from "../internal/connect";
import { ignoreGhostClicks } from "../internal/ghost-click";
import { normalizeProps } from "../normalize";

export type SelectItem = core.SelectItem;
export type SelectApi = core.SelectApi;
export type SelectState = core.SelectState;
export type SelectContext = core.SelectContext;

export interface CreateSelect {
  /** Reactive resolved state. */
  state: Readable<SelectState>;
  /** Reactive connected API. */
  api: Readable<SelectApi>;
  /** The selected value (or `null`). */
  value: Readable<string | null>;
  /** Whether the popup is open. */
  open: Readable<boolean>;
  /** Imperatively select a value. */
  setValue: (value: string) => void;
  /** Sync an externally-controlled value without emitting a change event. */
  syncValue: (value: string | null) => void;
  /** Replace the option list (e.g. when items change). */
  setItems: (items: SelectItem[]) => void;
  /** Sync an externally-controlled disabled state. */
  setDisabled: (disabled: boolean) => void;
  /** Svelte action for the label: `<span use:labelAction>`. */
  labelAction: Action<HTMLElement>;
  /** Svelte action for the trigger: `<button use:triggerAction>`. */
  triggerAction: Action<HTMLElement>;
  /** Svelte action for the listbox popup: `<ul use:listboxAction>`. */
  listboxAction: Action<HTMLElement>;
  /** Svelte action for an option: `<li use:optionAction={value}>`. */
  optionAction: Action<HTMLElement, string>;
}

/** How long a typeahead buffer lives before it resets (ms). */
const TYPEAHEAD_RESET = 500;

/**
 * Create a headless select (collapsible single-select listbox). Behaviour and
 * accessibility live in `@design-system/core`; this adapter wires the state to
 * a Svelte store, applies each part's connected props via actions, and owns the
 * DOM concerns the pure core can't: popup positioning (via `@floating-ui/dom`,
 * with flip/shift), typeahead, close-on-outside-pointer, and keeping the active
 * option scrolled into view. DOM focus stays on the trigger (activedescendant).
 */
export function createSelect(context: SelectContext): CreateSelect {
  const state = writable<SelectState>(core.initialState(context));

  const updateValue = (value: string | null, notify: boolean) =>
    state.update((current) => {
      if (current.value === value) return current;
      if (notify && value != null) context.onValueChange?.(value);
      return { ...current, value };
    });

  const setValue = (value: string) => updateValue(value, true);
  const syncValue = (value: string | null) => updateValue(value, false);

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

  const setItems = (items: SelectItem[]) =>
    state.update((current) => ({
      ...current,
      items,
      activeValue:
        current.activeValue && items.some((item) => item.value === current.activeValue)
          ? current.activeValue
          : null,
    }));

  const setDisabled = (disabled: boolean) =>
    state.update((current) => (current.disabled === disabled ? current : { ...current, disabled }));

  const api = derived(state, ($state) =>
    core.connect({ state: $state, setValue, setOpen, setActiveValue, normalize: normalizeProps }),
  );

  let triggerEl: HTMLElement | null = null;
  let listboxEl: HTMLElement | null = null;

  const placement: Placement = "bottom-start";
  const reposition = () => {
    if (!triggerEl || !listboxEl) return;
    computePosition(triggerEl, listboxEl, {
      placement,
      strategy: "fixed",
      middleware: [offset(4), flip({ padding: 8 }), shift({ padding: 8 })],
    }).then(({ x, y }) => {
      if (!listboxEl) return;
      listboxEl.style.left = `${x}px`;
      listboxEl.style.top = `${y}px`;
    });
  };

  const onOutsidePointer = (event: Event) => {
    const target = event.target as Node;
    if (triggerEl?.contains(target) || listboxEl?.contains(target)) return;
    setOpen(false);
    setActiveValue(null);
  };

  const labelAction = createPropsAction(api, (a) => a.labelProps);

  const triggerAction: Action<HTMLElement> = (node) => {
    triggerEl = node;
    const base = createPropsAction(api, (a) => a.triggerProps)(node);
    // Drop iOS's synthesized duplicate click so the listbox doesn't toggle twice.
    const stopGhost = ignoreGhostClicks(node);

    // Typeahead: printable characters jump to the next matching option.
    let buffer = "";
    let timer: ReturnType<typeof setTimeout> | undefined;
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
      if (!current.open) setOpen(true);
      const match = core.matchOption(current.items, buffer, current.activeValue);
      if (match) setActiveValue(match);
    };
    node.addEventListener("keydown", onKeyDown);

    return {
      destroy() {
        node.removeEventListener("keydown", onKeyDown);
        stopGhost();
        clearTimeout(timer);
        if (triggerEl === node) triggerEl = null;
        base?.destroy?.();
      },
    };
  };

  const listboxAction: Action<HTMLElement> = (node) => {
    listboxEl = node;
    const base = createPropsAction(api, (a) => a.listboxProps)(node);

    let stopAutoUpdate: (() => void) | null = null;
    const teardownPositioning = () => {
      stopAutoUpdate?.();
      stopAutoUpdate = null;
      document.removeEventListener("pointerdown", onOutsidePointer, true);
    };

    const unsubscribe = state.subscribe(($state) => {
      if ($state.open) {
        if (!stopAutoUpdate && triggerEl) {
          // Match the trigger's width, then position (and keep positioned).
          node.style.minWidth = `${triggerEl.offsetWidth}px`;
          if (typeof ResizeObserver !== "undefined") {
            stopAutoUpdate = autoUpdate(triggerEl, node, reposition);
          } else {
            reposition();
            stopAutoUpdate = () => {};
          }
          document.addEventListener("pointerdown", onOutsidePointer, true);
        }
        // Keep the active option in view after the DOM has been patched.
        requestAnimationFrame(() => {
          const active = node.querySelector<HTMLElement>("[data-active]");
          active?.scrollIntoView?.({ block: "nearest" });
        });
      } else {
        teardownPositioning();
      }
    });

    return {
      destroy() {
        unsubscribe();
        teardownPositioning();
        if (listboxEl === node) listboxEl = null;
        base?.destroy?.();
      },
    };
  };

  const optionAction: Action<HTMLElement, string> = (node, value) => {
    const optionApi = derived(api, (a) => a.getOptionProps(value));
    const handle = createPropsAction(optionApi, (props) => props)(node);
    return { destroy: () => handle?.destroy?.() };
  };

  return {
    state,
    api,
    value: derived(state, ($state) => $state.value),
    open: derived(state, ($state) => $state.open),
    setValue,
    syncValue,
    setItems,
    setDisabled,
    labelAction,
    triggerAction,
    listboxAction,
    optionAction,
  };
}
