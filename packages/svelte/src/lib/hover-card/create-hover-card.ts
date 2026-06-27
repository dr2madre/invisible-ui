import { hoverCard as core } from "@design-system/core";
import type { Action } from "svelte/action";
import { derived, get, writable, type Readable } from "svelte/store";
import { createPropsAction } from "../internal/connect";
import { attachFloating, type Placement } from "../internal/floating";
import { normalizeProps } from "../normalize";

export type HoverCardApi = core.HoverCardApi;
export type HoverCardState = core.HoverCardState;

export interface HoverCardContext extends core.HoverCardContext {
  /** Preferred placement of the card. Default `"bottom"`. */
  placement?: Placement;
  /** Gap between trigger and card, in px. Default `8`. */
  offset?: number;
  /** Delay before opening on hover, in ms. Default `300`. */
  openDelay?: number;
  /** Delay before closing on leave, in ms. Default `200`. */
  closeDelay?: number;
}

export interface CreateHoverCard {
  state: Readable<HoverCardState>;
  api: Readable<HoverCardApi>;
  open: Readable<boolean>;
  /** Imperatively set the open state. */
  setOpen: (open: boolean) => void;
  /** Svelte action for the trigger (wrap a focusable element). */
  triggerAction: Action<HTMLElement>;
  /** Svelte action for the content card (render only while open). */
  contentAction: Action<HTMLElement>;
}

/**
 * Create a headless hover card. ARIA/state live in `@design-system/core`; this
 * adapter owns the DOM concerns, reusing the shared overlay primitives:
 * open/close on hover **and** focus (with delays), `attachFloating` positioning,
 * and — since the card is non-modal and supplementary — it stays open while the
 * pointer is over the card (hoverable), closes when focus leaves both the
 * trigger and the card, and is Escape-dismissable. Focus is never moved into the
 * card; Tab reaches its links naturally.
 */
export function createHoverCard(context: HoverCardContext = {}): CreateHoverCard {
  const state = writable<HoverCardState>(core.initialState(context));
  const { placement = "bottom", offset = 8, openDelay = 300, closeDelay = 200 } = context;

  const setOpen = (open: boolean) =>
    state.update((current) => {
      if (current.open === open) return current;
      context.onOpenChange?.(open);
      return { ...current, open };
    });

  const api = derived(state, ($state) =>
    core.connect({ state: $state, normalize: normalizeProps }),
  );

  let triggerEl: HTMLElement | null = null;
  let showTimer: ReturnType<typeof setTimeout> | undefined;
  let hideTimer: ReturnType<typeof setTimeout> | undefined;

  const clearTimers = () => {
    clearTimeout(showTimer);
    clearTimeout(hideTimer);
  };
  const show = (delay: number) => {
    clearTimers();
    if (delay <= 0) return setOpen(true);
    showTimer = setTimeout(() => setOpen(true), delay);
  };
  const hide = (delay: number) => {
    clearTimers();
    if (delay <= 0) return setOpen(false);
    hideTimer = setTimeout(() => setOpen(false), delay);
  };

  const triggerAction: Action<HTMLElement> = (node) => {
    triggerEl = node;
    const base = createPropsAction(api, (a) => a.triggerProps)(node);

    const onEnter = (e: Event) => {
      if ((e as PointerEvent).pointerType === "touch") return; // tap owns touch
      show(openDelay);
    };
    const onLeave = () => hide(closeDelay);
    const onFocusIn = () => show(0); // keyboard focus opens immediately
    // Touch/pen: a tap toggles the hover card (no hover on mobile).
    let touch = false;
    const onPointerDown = (e: Event) => {
      touch = (e as PointerEvent).pointerType !== "mouse";
    };
    const onTap = () => {
      if (!touch) return;
      if (get(state).open) hide(0);
      else show(0);
    };
    node.addEventListener("pointerenter", onEnter);
    node.addEventListener("pointerleave", onLeave);
    node.addEventListener("focusin", onFocusIn);
    node.addEventListener("pointerdown", onPointerDown);
    node.addEventListener("click", onTap);

    return {
      destroy() {
        clearTimers();
        node.removeEventListener("pointerenter", onEnter);
        node.removeEventListener("pointerleave", onLeave);
        node.removeEventListener("focusin", onFocusIn);
        node.removeEventListener("pointerdown", onPointerDown);
        node.removeEventListener("click", onTap);
        if (triggerEl === node) triggerEl = null;
        base?.destroy?.();
      },
    };
  };

  const contentAction: Action<HTMLElement> = (node) => {
    const base = createPropsAction(api, (a) => a.contentProps)(node);
    const stopFloating = triggerEl
      ? attachFloating(triggerEl, node, { placement, offset })
      : () => {};

    // Hoverable: keep open while the pointer is over the card.
    const onEnter = () => clearTimers();
    const onLeave = () => hide(closeDelay);
    node.addEventListener("pointerenter", onEnter);
    node.addEventListener("pointerleave", onLeave);

    // Close when focus moves outside both the trigger and the card.
    const onFocusIn = (event: FocusEvent) => {
      const target = event.target as Node;
      if (node.contains(target) || triggerEl?.contains(target)) return;
      hide(0);
    };
    document.addEventListener("focusin", onFocusIn);

    // Escape closes; if focus was inside the card, return it to the trigger.
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const restore = node.contains(document.activeElement);
      hide(0);
      if (restore && triggerEl?.isConnected) {
        const focusable = triggerEl.querySelector<HTMLElement>(
          'a[href], button, input, [tabindex]:not([tabindex="-1"])',
        );
        (focusable ?? triggerEl).focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);

    return {
      destroy() {
        stopFloating();
        node.removeEventListener("pointerenter", onEnter);
        node.removeEventListener("pointerleave", onLeave);
        document.removeEventListener("focusin", onFocusIn);
        document.removeEventListener("keydown", onKeyDown);
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
