import { dialog as core } from "@design-system/core";
import { tick } from "svelte";
import type { Action } from "svelte/action";
import { derived, writable, type Readable } from "svelte/store";
import { createPropsAction } from "../internal/connect";
import { onOutsidePointerDown } from "../internal/dismiss";
import { trapFocus } from "../internal/focus-trap";
import { lockScroll } from "../internal/scroll-lock";
import { normalizeProps } from "../normalize";

export type DialogApi = core.DialogApi;
export type DialogState = core.DialogState;
export type DialogRole = core.DialogRole;

export interface DialogContext extends core.DialogContext {
  /** Whether a description element is present (wires `aria-describedby`). */
  describedBy?: boolean;
  /** Whether Escape closes the dialog. Default `true`. */
  closeOnEscape?: boolean;
  /** Whether pressing the backdrop / outside the panel closes. Default `true`. */
  closeOnOutsideClick?: boolean;
  /**
   * CSS selector (within the panel) for the element to focus on open. When
   * omitted, focus lands on the panel itself — never on the close button — so a
   * screen reader announces the dialog without snapping focus to a "✕".
   */
  initialFocus?: string;
}

export interface CreateDialog {
  state: Readable<DialogState>;
  api: Readable<DialogApi>;
  /** Whether the dialog is open. */
  open: Readable<boolean>;
  /** Imperatively set the open state. */
  setOpen: (open: boolean) => void;
  /** Svelte action for the trigger: `<button use:triggerAction>`. */
  triggerAction: Action<HTMLElement>;
  /** Svelte action for the dialog panel (render only while open). */
  contentAction: Action<HTMLElement>;
  /** Svelte action for the title element. */
  titleAction: Action<HTMLElement>;
  /** Svelte action for the description element. */
  descriptionAction: Action<HTMLElement>;
  /** Svelte action for a close button inside the dialog. */
  closeAction: Action<HTMLElement>;
}

/**
 * Create a headless modal dialog. Behaviour/ARIA live in `@design-system/core`
 * (role, `aria-modal`, labelling, Escape); this adapter owns the modal DOM
 * concerns, reusing the shared overlay primitives: a focus trap
 * (`trapFocus`), scroll lock (`lockScroll`) and outside-press dismiss
 * (`onOutsidePointerDown`). On open it moves focus into the panel; on close it
 * returns focus to whatever was focused before (typically the trigger).
 *
 * Render the panel only while open so the content action's lifecycle tracks the
 * open state (and the portal mounts/unmounts with it).
 */
export function createDialog(context: DialogContext = {}): CreateDialog {
  const state = writable<DialogState>(core.initialState(context));
  const closeOnOutsideClick = context.closeOnOutsideClick ?? true;

  const setOpen = (open: boolean) =>
    state.update((current) => {
      if (current.open === open) return current;
      context.onOpenChange?.(open);
      return { ...current, open };
    });

  const api = derived(state, ($state) =>
    core.connect({
      state: $state,
      setOpen,
      describedBy: context.describedBy,
      closeOnEscape: context.closeOnEscape,
      normalize: normalizeProps,
    }),
  );

  let triggerEl: HTMLElement | null = null;

  const triggerAction: Action<HTMLElement> = (node) => {
    triggerEl = node;
    const base = createPropsAction(api, (a) => a.triggerProps)(node);
    return {
      destroy() {
        if (triggerEl === node) triggerEl = null;
        base?.destroy?.();
      },
    };
  };

  const contentAction: Action<HTMLElement> = (node) => {
    const base = createPropsAction(api, (a) => a.contentProps)(node);

    // Capture focus before it moves into the dialog, to restore on close.
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const releaseScroll = lockScroll();
    const releaseTrap = trapFocus(node);
    const stopOutside = closeOnOutsideClick
      ? onOutsidePointerDown([node], () => setOpen(false))
      : () => {};

    // Move focus into the panel after the portal has relocated it to <body> —
    // reparenting drops focus, so this must run after the mount completes (a
    // microtask later), not inline. With `initialFocus`, focus that element;
    // otherwise focus the panel itself (never the close button).
    tick().then(() => {
      const target = context.initialFocus
        ? node.querySelector<HTMLElement>(context.initialFocus)
        : null;
      (target ?? node).focus();
    });

    return {
      destroy() {
        base?.destroy?.();
        stopOutside();
        releaseTrap();
        releaseScroll();
        // Return focus to where it was (the trigger, usually).
        const restore = triggerEl ?? previouslyFocused;
        if (restore?.isConnected) restore.focus();
      },
    };
  };

  const titleAction: Action<HTMLElement> = (node) =>
    createPropsAction(api, (a) => a.titleProps)(node);
  const descriptionAction: Action<HTMLElement> = (node) =>
    createPropsAction(api, (a) => a.descriptionProps)(node);
  const closeAction: Action<HTMLElement> = (node) =>
    createPropsAction(api, (a) => a.closeProps)(node);

  return {
    state,
    api,
    open: derived(state, ($state) => $state.open),
    setOpen,
    triggerAction,
    contentAction,
    titleAction,
    descriptionAction,
    closeAction,
  };
}
