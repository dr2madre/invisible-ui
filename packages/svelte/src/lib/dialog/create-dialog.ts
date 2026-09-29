import { dialog as core } from "@design-system/core";
import { tick } from "svelte";
import type { Action } from "svelte/action";
import { get, derived, writable, type Readable } from "svelte/store";
import { createPropsAction } from "../internal/connect";
import { returnFocus, trackModal } from "../internal/modal-stack";
import { lockScroll } from "../internal/scroll-lock";
import { stableId } from "../internal/stable-id";
import { normalizeProps } from "../normalize";

export type DialogApi = core.DialogApi;
export type DialogState = core.DialogState;
export type DialogRole = core.DialogRole;

export type DialogNoticeStatus = "info" | "success" | "warning" | "danger" | "neutral";

/** The button a dialog notice offers, such as Retry after a failed upload. */
export interface DialogNoticeAction {
  label: string;
  /** Runs when the button is pressed; the notice then closes. */
  onAction: () => void;
}

/** A message about the dialog's own task, shown in its status area (ADR 0016). */
export interface DialogNoticeOptions {
  /** `info` by default. */
  status?: DialogNoticeStatus;
  title: string;
  description?: string;
  action?: DialogNoticeAction;
  /** Whether the notice has a close button. Defaults to `true`. */
  dismissible?: boolean;
}

/** A notice in the status area, with its id. */
export interface DialogNotice extends DialogNoticeOptions {
  id: string;
  status: DialogNoticeStatus;
}

/** One line the status area's live region reads out. */
export interface DialogAnnouncement {
  id: string;
  text: string;
}

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
  /** The notices of the status area, oldest first (ADR 0016). */
  notices: Readable<DialogNotice[]>;
  /** What the status area's polite live region reads out now. */
  announcement: Readable<DialogAnnouncement[]>;
  /**
   * Show a notice in the status area and return its id. On a closed dialog
   * it shows nothing and returns an empty string.
   */
  notify: (options: DialogNoticeOptions) => string;
  /** Remove one notice from the status area. */
  dismissNotice: (id: string) => void;
  /** Remove every notice from the status area. */
  clearNotices: () => void;
}

const NOTICE_STATUSES: DialogNoticeStatus[] = ["info", "success", "warning", "danger", "neutral"];
// Text written right after a live region empties is announced more reliably.
const ANNOUNCE_DELAY = 100;
let noticeCounter = 0;

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
 *
 * Closing returns focus to `returnFocusTo` when it names an element, else to
 * the element that had focus when the dialog opened, so a dialog opened from
 * inside another hands focus back there, else to the trigger.
 *
 * The status area (ADR 0016) holds messages about the dialog's own task:
 * `notify()` adds a notice to `notices` and writes it once to
 * `announcement`, for a polite live region that is in the panel before it
 * speaks. Notices belong to one opening: closing clears them.
 */
export function createDialog(context: DialogContext = {}): CreateDialog {
  const state = writable<DialogState>(
    core.initialState({ ...context, id: context.id ?? stableId("ds-dialog") }),
  );
  const closeOnOutsideClick = context.closeOnOutsideClick ?? true;

  // Set while a panel is mounted: gives focus back and leaves the top layer.
  // A close runs it before the state changes, so focus is out of the panel
  // before Svelte removes it. A focused element that leaves the page fires
  // focusout, and a listener that writes state from there, a tooltip around
  // the dialog for one, would do so while Svelte updates the block, which
  // Svelte refuses (`state_unsafe_mutation`) and which stops every update
  // after it.
  let releasePanel: (() => void) | null = null;
  let panelEl: HTMLElement | null = null;

  const notices = writable<DialogNotice[]>([]);
  const announcement = writable<DialogAnnouncement[]>([]);
  let pending: DialogNotice[] = [];
  let announceTimer: ReturnType<typeof setTimeout> | undefined;

  const announce = (notice: DialogNotice) => {
    pending.push(notice);
    if (announceTimer !== undefined) return;
    // Emptied first, so the same text twice is still a change.
    announcement.set([]);
    announceTimer = setTimeout(() => {
      announceTimer = undefined;
      const lines = pending.flatMap((entry) => [
        { id: `${entry.id}-title`, text: entry.title },
        ...(entry.description ? [{ id: `${entry.id}-description`, text: entry.description }] : []),
      ]);
      pending = [];
      if (lines.length) announcement.set(lines);
    }, ANNOUNCE_DELAY);
  };

  const notify = (options: DialogNoticeOptions): string => {
    if (!get(state).open) return "";
    const id = `dialog-notice-${++noticeCounter}`;
    const status = NOTICE_STATUSES.includes(options.status as DialogNoticeStatus)
      ? (options.status as DialogNoticeStatus)
      : "info";
    const notice: DialogNotice = { ...options, id, status };
    notices.update((items) => [...items, notice]);
    announce(notice);
    return id;
  };

  const dismissNotice = (id: string) => {
    if (!get(notices).some((notice) => notice.id === id)) return;
    pending = pending.filter((entry) => entry.id !== id);
    const panel = panelEl;
    const focused = typeof document === "undefined" ? null : document.activeElement;
    notices.update((items) => items.filter((notice) => notice.id !== id));
    // Removing the element that holds focus would drop focus to the page:
    // the panel takes it, the way it does when the dialog opens.
    if (panel && focused instanceof HTMLElement && panel.contains(focused)) {
      void tick().then(() => {
        if (!focused.isConnected && panel.isConnected) panel.focus();
      });
    }
  };

  const clearNotices = () => {
    clearTimeout(announceTimer);
    announceTimer = undefined;
    pending = [];
    notices.set([]);
    announcement.set([]);
  };

  const setOpen = (open: boolean) => {
    const current = get(state);
    if (current.open === open) return;
    if (!open) {
      releasePanel?.();
      clearNotices();
    }
    state.set({ ...current, open });
    context.onOpenChange?.(open);
  };

  // Reflect a controlled `open` prop without reporting a change: opening a
  // dialog from the outside is not the user asking for it.
  const syncOpen = (open: boolean) => {
    if (get(state).open === open) return;
    if (!open) {
      releasePanel?.();
      clearNotices();
    }
    state.update((current) => ({ ...current, open }));
  };

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
    const releaseModal = trackModal(dialogEl);
    const releaseScroll = lockScroll();
    panelEl = node;

    // Native Escape: route through our state (the {#if} removes the element)
    // instead of letting the platform close it out from under us.
    const onCancel = (event: Event) => {
      event.preventDefault();
      if (context.closeOnEscape !== false) setOpen(false);
    };
    // Any other native close (e.g. a `method="dialog"` form) syncs the state.
    // Only the panel's own: an element inside it can emit a bubbling `close`.
    const onClose = (event: Event) => {
      if (event.target === node) setOpen(false);
    };
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
      if (!inside) {
        event.preventDefault();
        setOpen(false);
      }
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

    // Runs once: on close, before the state changes, or on destroy when the
    // panel goes away some other way (the component unmounts while open).
    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      if (releasePanel === release) releasePanel = null;
      dialogEl.removeEventListener("cancel", onCancel);
      dialogEl.removeEventListener("close", onClose);
      dialogEl.removeEventListener("pointerdown", onPointerDown);
      // Out of the top layer first: while it is modal the page is inert and
      // focus cannot go back to it.
      if (dialogEl.open) dialogEl.close();
      releaseModal();
      releaseScroll();
      if (panelEl === node) panelEl = null;
      clearNotices();
      // Where focus goes back to: what the consumer named, else whatever
      // held focus when it opened, else this dialog's own trigger.
      const named = context.returnFocusTo
        ? document.querySelector<HTMLElement>(context.returnFocusTo)
        : null;
      if (named?.isConnected) named.focus();
      else returnFocus(previouslyFocused, triggerEl);
    };
    releasePanel = release;

    return {
      destroy() {
        release();
        base?.destroy?.();
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
    notices,
    announcement,
    notify,
    dismissNotice,
    clearNotices,
  };
}
