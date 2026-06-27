import { popover as core } from "@design-system/core";
import type { Action } from "svelte/action";
import { derived, writable, type Readable } from "svelte/store";
import { createPropsAction } from "../internal/connect";
import { ignoreGhostClicks } from "../internal/ghost-click";
import { attachFloating, type Placement } from "../internal/floating";
import { onOutsidePointerDown } from "../internal/dismiss";
import { normalizeProps } from "../normalize";

export type PopoverApi = core.PopoverApi;
export type PopoverState = core.PopoverState;

export interface PopoverContext extends core.PopoverContext {
  /** Preferred placement of the panel. Default `"bottom"`. */
  placement?: Placement;
  /** Gap between trigger and panel, in px. Default `6`. */
  offset?: number;
}

export interface CreatePopover {
  state: Readable<PopoverState>;
  api: Readable<PopoverApi>;
  /** Whether the panel is open. */
  open: Readable<boolean>;
  /** Imperatively set the open state. */
  setOpen: (open: boolean) => void;
  /** Svelte action for the trigger: `<button use:triggerAction>`. */
  triggerAction: Action<HTMLElement>;
  /** Svelte action for the content panel (render only while open). */
  contentAction: Action<HTMLElement>;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Create a headless popover. Behaviour/ARIA live in `@design-system/core`; this
 * adapter owns the DOM concerns, reusing the shared overlay primitives:
 * `attachFloating` (flip/shift positioning) and `onOutsidePointerDown`
 * (outside-press dismiss). Plus focus management — move focus into the panel on
 * open, return it to the trigger on close, and close when focus leaves the
 * panel (non-modal popover semantics).
 *
 * Render the content only while open so the content action's lifecycle tracks
 * the open state.
 */
export function createPopover(context: PopoverContext = {}): CreatePopover {
  const state = writable<PopoverState>(core.initialState(context));
  const { placement = "bottom", offset = 6 } = context;

  const setOpen = (open: boolean) =>
    state.update((current) => {
      if (current.open === open) return current;
      context.onOpenChange?.(open);
      return { ...current, open };
    });

  const api = derived(state, ($state) =>
    core.connect({ state: $state, setOpen, normalize: normalizeProps }),
  );

  let triggerEl: HTMLElement | null = null;

  const triggerAction: Action<HTMLElement> = (node) => {
    triggerEl = node;
    const base = createPropsAction(api, (a) => a.triggerProps)(node);
    // Drop iOS's synthesized duplicate click so the popover doesn't toggle twice.
    const stopGhost = ignoreGhostClicks(node);
    return {
      destroy() {
        stopGhost();
        if (triggerEl === node) triggerEl = null;
        base?.destroy?.();
      },
    };
  };

  const contentAction: Action<HTMLElement> = (node) => {
    const base = createPropsAction(api, (a) => a.contentProps)(node);

    // Position against the trigger and keep it positioned.
    const stopFloating = triggerEl
      ? attachFloating(triggerEl, node, { placement, offset })
      : () => {};

    // Outside press closes (focus follows the pointer — don't restore).
    const stopOutside = onOutsidePointerDown([triggerEl, node], () => setOpen(false));

    // Non-modal: close when focus moves out of trigger + panel (don't restore).
    const onFocusIn = (event: FocusEvent) => {
      const target = event.target as Node;
      if (node.contains(target) || triggerEl?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("focusin", onFocusIn);

    // Only a keyboard dismiss (Escape) should send focus back to the trigger.
    let restoreFocus = false;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") restoreFocus = true;
    };
    node.addEventListener("keydown", onKeyDown);

    // Move focus into the panel (first focusable, else the panel itself).
    const first = node.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? node).focus();

    return {
      destroy() {
        stopFloating();
        stopOutside();
        document.removeEventListener("focusin", onFocusIn);
        node.removeEventListener("keydown", onKeyDown);
        if (restoreFocus && triggerEl?.isConnected) triggerEl.focus();
        base?.destroy?.();
      },
    };
  };

  return {
    state,
    api,
    open: derived(state, ($state) => $state.open),
    setOpen,
    triggerAction,
    contentAction,
  };
}
