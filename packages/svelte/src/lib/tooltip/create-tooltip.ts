import { tooltip as core } from "@design-system/core";
import type { Action } from "svelte/action";
import { derived, get, writable, type Readable } from "svelte/store";
import { createPropsAction } from "../internal/connect";
import { attachFloating, type Placement } from "../internal/floating";
import { normalizeProps } from "../normalize";

export type TooltipApi = core.TooltipApi;
export type TooltipState = core.TooltipState;

export interface TooltipContext extends core.TooltipContext {
  /** Preferred placement. Default `"top"`. */
  placement?: Placement;
  /** Gap between trigger and tooltip, in px. Default `6`. */
  offset?: number;
  /** Delay before showing on hover, in ms. Default `300`. */
  openDelay?: number;
  /** Delay before hiding on leave, in ms. Default `100`. */
  closeDelay?: number;
}

export interface CreateTooltip {
  state: Readable<TooltipState>;
  api: Readable<TooltipApi>;
  open: Readable<boolean>;
  /** Svelte action for the trigger element. */
  triggerAction: Action<HTMLElement>;
  /** Svelte action for the tooltip element (render only while open). */
  tooltipAction: Action<HTMLElement>;
}

/**
 * Create a headless tooltip. Behaviour/ARIA live in `@design-system/core`; this
 * adapter owns the DOM concerns: open/close delays, show on hover **and** focus,
 * Floating-UI positioning (flip/shift), and WCAG 1.4.13 "content on hover"
 * semantics — the tooltip stays open while hovered (hoverable) and is dismissed
 * with Escape (dismissable). Focus is never moved into the tooltip.
 */
export function createTooltip(context: TooltipContext = {}): CreateTooltip {
  const state = writable<TooltipState>(core.initialState(context));
  const { placement = "top", offset = 6, openDelay = 300, closeDelay = 100 } = context;

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
      // Touch has no hover; the tap (onTap) owns touch so it doesn't flash.
      if ((e as PointerEvent).pointerType === "touch") return;
      show(openDelay);
    };
    const onLeave = () => hide(closeDelay);
    const onFocusIn = () => show(0); // keyboard focus shows immediately
    const onFocusOut = () => hide(0);
    // Touch/pen: a tap toggles the tooltip (no hover available on mobile).
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
    node.addEventListener("focusout", onFocusOut);
    node.addEventListener("pointerdown", onPointerDown);
    node.addEventListener("click", onTap);

    return {
      destroy() {
        clearTimers();
        node.removeEventListener("pointerenter", onEnter);
        node.removeEventListener("pointerleave", onLeave);
        node.removeEventListener("focusin", onFocusIn);
        node.removeEventListener("focusout", onFocusOut);
        node.removeEventListener("pointerdown", onPointerDown);
        node.removeEventListener("click", onTap);
        if (triggerEl === node) triggerEl = null;
        base?.destroy?.();
      },
    };
  };

  const tooltipAction: Action<HTMLElement> = (node) => {
    const base = createPropsAction(api, (a) => a.tooltipProps)(node);
    const stopFloating = triggerEl
      ? attachFloating(triggerEl, node, { placement, offset })
      : () => {};

    // Hoverable: keep open while the pointer is over the tooltip itself.
    const onEnter = () => clearTimers();
    const onLeave = () => hide(closeDelay);
    node.addEventListener("pointerenter", onEnter);
    node.addEventListener("pointerleave", onLeave);

    // Dismissable: Escape hides immediately, even while hovering.
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") hide(0);
    };
    document.addEventListener("keydown", onKeyDown);

    return {
      destroy() {
        stopFloating();
        node.removeEventListener("pointerenter", onEnter);
        node.removeEventListener("pointerleave", onLeave);
        document.removeEventListener("keydown", onKeyDown);
        base?.destroy?.();
      },
    };
  };

  return {
    state,
    api,
    open: derived(state, ($state) => $state.open),
    triggerAction,
    tooltipAction,
  };
}
