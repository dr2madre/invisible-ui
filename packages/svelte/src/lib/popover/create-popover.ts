import { popover as core } from "@design-system/core";
import type { Action } from "svelte/action";
import { derived, writable, type Readable } from "svelte/store";
import { createPropsAction } from "../internal/connect";
import { ignoreGhostClicks } from "../internal/ghost-click";
import { attachFloating, type Placement } from "../internal/floating";
import { onOutsidePointerDown } from "../internal/dismiss";
import { stableId } from "../internal/stable-id";
import { normalizeProps } from "../normalize";

export type PopoverApi = core.PopoverApi;
export type PopoverState = core.PopoverState;

export interface PopoverContext extends core.PopoverContext {
  /** Preferred placement of the panel. Default `"bottom"`. */
  placement?: Placement;
  /** Gap between trigger and panel, in px. Default `6`. */
  offset?: number;
  /** Name for the panel. Defaults to being named by the trigger. */
  label?: string;
}

export interface CreatePopover {
  state: Readable<PopoverState>;
  api: Readable<PopoverApi>;
  /** Update the panel's name (no notification: naming is not an action). */
  setLabel: (label: string | undefined) => void;
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
  const state = writable<PopoverState>(
    core.initialState({ ...context, id: context.id ?? stableId("ds-popover") }),
  );
  const { placement = "bottom", offset = 6 } = context;

  const setOpen = (open: boolean) =>
    state.update((current) => {
      if (current.open === open) return current;
      context.onOpenChange?.(open);
      return { ...current, open };
    });

  // The panel's name can change after mount (a localized label, or one that
  // follows a selection), so it is mirrored rather than captured.
  const label = writable<string | undefined>(context.label);

  const api = derived([state, label], ([$state, $label]) =>
    core.connect({ state: $state, setOpen, label: $label, normalize: normalizeProps }),
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
    // Only a keyboard dismiss (Escape) should send focus back to the trigger.
    // Capture phase, registered before the close handler: closing tears the
    // panel down synchronously, so the flag must already be set when the
    // action's destroy runs.
    let restoreFocus = false;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") restoreFocus = true;
    };
    node.addEventListener("keydown", onKeyDown, true);

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

    // Move focus into the panel (first focusable, else the panel itself).
    const first = node.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? node).focus();

    return {
      destroy() {
        stopFloating();
        stopOutside();
        document.removeEventListener("focusin", onFocusIn);
        node.removeEventListener("keydown", onKeyDown, true);
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
    setLabel: (next: string | undefined) => label.set(next),
    triggerAction,
    contentAction,
  };
}
