import { dialog as core } from "@design-system/core";
import { tick } from "svelte";
import type { Action } from "svelte/action";
import { get, derived, writable, type Readable } from "svelte/store";
import { createPropsAction } from "../internal/connect";
import { lockScroll } from "../internal/scroll-lock";
import { stableId } from "../internal/stable-id";
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
  /**
   * CSS selector (anywhere in the page) for the element focus goes back to on
   * close. Only needed when the dialog has no trigger of its own: without it
   * focus returns to whatever held it when the dialog opened, which is right
   * when a button opened it and wrong when something else did (ADR 0013).
   */
  returnFocusTo?: string;
}

export interface CreateDialog {
  state: Readable<DialogState>;
  api: Readable<DialogApi>;
  /** Whether the dialog is open. */
  open: Readable<boolean>;
  /** Imperatively set the open state. */
  setOpen: (open: boolean) => void;
  /** Reflect a controlled `open` prop without reporting a change. */
  syncOpen: (open: boolean) => void;
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
  const state = writable<DialogState>(
    core.initialState({ ...context, id: context.id ?? stableId("ds-dialog") }),
  );
  const closeOnOutsideClick = context.closeOnOutsideClick ?? true;

  const setOpen = (open: boolean) => {
    const current = get(state);
    if (current.open === open) return;
    state.set({ ...current, open });
    context.onOpenChange?.(open);
  };

  // Reflect a controlled `open` prop without reporting a change: opening a
  // dialog from the outside is not the user asking for it.
  const syncOpen = (open: boolean) =>
    state.update((current) => (current.open === open ? current : { ...current, open }));

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
        // Where focus goes back to: what the consumer named, else this
        // dialog's own trigger, else whatever held focus when it opened.
        const named = context.returnFocusTo
          ? document.querySelector<HTMLElement>(context.returnFocusTo)
          : null;
        const restore = named ?? triggerEl ?? previouslyFocused;
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
    syncOpen,
    triggerAction,
    contentAction,
    titleAction,
    descriptionAction,
    closeAction,
  };
}
