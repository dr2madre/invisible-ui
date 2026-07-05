import { dialog as core } from "@design-system/core";
import { tick } from "svelte";
import type { Action } from "svelte/action";
import { derived, writable, type Readable } from "svelte/store";
import { createPropsAction } from "../internal/connect";
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
 * Create a headless modal dialog on the native `<dialog>` element (ADR 0005).
 * Behaviour/ARIA live in `@design-system/core` (role, `aria-modal`, labelling,
 * Escape); the platform provides modality via `showModal()`: top-layer
 * rendering (no portal, no z-index), an inert background (a real focus trap,
 * enforced by the browser for keyboard *and* assistive tech), Escape via the
 * `cancel` event and a stylable `::backdrop`. This adapter keeps only what the
 * platform does not do: body scroll lock, backdrop light-dismiss (a pointer
 * press whose coordinates fall outside the panel), initial focus and focus
 * restore to the trigger.
 *
 * Attach `contentAction` to a `<dialog>` element and render it only while
 * open, so the action's lifecycle tracks the open state.
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
    const dialogEl = node as unknown as HTMLDialogElement;
    const base = createPropsAction(api, (a) => a.contentProps)(node);

    // Capture focus before it moves into the dialog, to restore on close.
    const previouslyFocused = document.activeElement as HTMLElement | null;

    // Top layer + inert background come from the platform.
    dialogEl.showModal();
    const releaseScroll = lockScroll();

    // Native Escape: route through our state (the {#if} removes the element)
    // instead of letting the platform close it out from under us.
    const onCancel = (event: Event) => {
      event.preventDefault();
      if (context.closeOnEscape !== false) setOpen(false);
    };
    // Any other native close (e.g. a `method="dialog"` form) syncs the state.
    const onClose = () => setOpen(false);
    // With the page inert, backdrop presses target the <dialog> itself; a
    // press whose coordinates fall outside the panel's box is a light dismiss.
    const onPointerDown = (event: PointerEvent) => {
      if (!closeOnOutsideClick || event.target !== node) return;
      const rect = node.getBoundingClientRect();
      const inside =
        rect.top <= event.clientY &&
        event.clientY <= rect.bottom &&
        rect.left <= event.clientX &&
        event.clientX <= rect.right;
      if (!inside) setOpen(false);
    };
    dialogEl.addEventListener("cancel", onCancel);
    dialogEl.addEventListener("close", onClose);
    dialogEl.addEventListener("pointerdown", onPointerDown);

    // `showModal()` focuses the first focusable; enforce our contract instead —
    // after the mount settles: `initialFocus` when given, else the panel itself
    // (never the close button).
    tick().then(() => {
      const target = context.initialFocus
        ? node.querySelector<HTMLElement>(context.initialFocus)
        : null;
      (target ?? node).focus();
    });

    return {
      destroy() {
        dialogEl.removeEventListener("cancel", onCancel);
        dialogEl.removeEventListener("close", onClose);
        dialogEl.removeEventListener("pointerdown", onPointerDown);
        if (dialogEl.open) dialogEl.close();
        base?.destroy?.();
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
