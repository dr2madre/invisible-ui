import { dialog as core } from "@design-system/core";
import { useCallback, useEffect, useId, useMemo, useRef, useState, type RefObject } from "react";
import { useIsomorphicLayoutEffect } from "../internal/layout-effect";
import { returnFocus } from "../internal/modal-stack";
import { lockScroll } from "../internal/scroll-lock";
import { normalizeProps } from "../normalize";
import { useDialogNotices, type DialogNotices } from "./use-dialog-notices";

export type DialogRole = core.DialogRole;

export interface UseDialogOptions {
  /** Initial / controlled open state. */
  open?: boolean;
  /** `"dialog"` (default) or `"alertdialog"`. */
  role?: DialogRole;
  /** Whether a description element is present (wires `aria-describedby`). */
  describedBy?: boolean;
  /** Whether Escape closes the dialog. Default `true`. */
  closeOnEscape?: boolean;
  /** Whether pressing the backdrop closes. Default `true`. */
  closeOnOutsideClick?: boolean;
  /**
   * CSS selector (within the panel) for the element to focus on open. When
   * omitted, focus lands on the panel itself — never on the close button — so a
   * screen reader announces the dialog without snapping focus to a "✕".
   */
  initialFocus?: string;
  onOpenChange?: (open: boolean) => void;
}

export interface UseDialog extends DialogNotices {
  api: core.DialogApi;
  open: boolean;
  setOpen: (open: boolean) => void;
  /** Attach to the trigger; used to restore focus on close. */
  triggerRef: RefObject<HTMLButtonElement | null>;
  /** Attach to the `<dialog>` panel. Render it only while `open`. */
  panelRef: RefObject<HTMLDialogElement | null>;
}

/**
 * Connect the headless Dialog to React on the native `<dialog>` element
 * (ADR 0005).
 *
 * Behaviour and ARIA live in `@design-system/core` (role, `aria-modal`,
 * labelling, Escape). Modality comes from the platform via `showModal()`: top
 * layer (no portal, no z-index), an inert background — a real focus trap the
 * browser enforces for keyboard *and* assistive tech — and a stylable
 * `::backdrop`. This hook adds only what the platform does not: body scroll
 * lock, backdrop light-dismiss, initial focus and focus restore.
 *
 * It also holds the dialog's status area (ADR 0016): `notify(options)` adds a
 * notice about the dialog's own task and returns its id, `dismissNotice(id)`
 * and `clearNotices()` remove notices, and `notices` and `announcement` are
 * what to render, between the body and the footer. Notices belong to one
 * opening: `notify()` while closed returns an empty string, and closing clears
 * them. Closing returns focus to the element that had it when the dialog
 * opened, so a dialog opened from inside another hands focus back there;
 * otherwise to the trigger.
 *
 * The panel must be rendered only while open, so the effect's lifecycle tracks
 * the open state — the React counterpart of the Svelte action's lifecycle.
 */
export function useDialog({
  open: openProp = false,
  role = "dialog",
  describedBy = false,
  closeOnEscape = true,
  closeOnOutsideClick = true,
  initialFocus,
  onOpenChange,
}: UseDialogOptions = {}): UseDialog {
  const id = `ds-dialog-${useId()}`;
  const [open, setOpenState] = useState(openProp);

  // Mirror an externally controlled `open` without an effect.
  const [lastProp, setLastProp] = useState(openProp);
  if (openProp !== lastProp) {
    setLastProp(openProp);
    setOpenState(openProp);
  }

  // Writes first and reports afterwards (ADR 0011), from the handler that
  // called it, never from inside a state updater, which React may run twice
  // or while rendering. It reports only a change the open state really makes.
  const setOpen = useCallback(
    (next: boolean) => {
      if (open === next) return;
      setOpenState(next);
      onOpenChange?.(next);
    },
    [open, onOpenChange],
  );

  // Latest inputs, read by the panel's listeners without re-running the effect
  // that shows the panel (and moves focus into it) whenever they change.
  const latest = useRef({ setOpen, initialFocus, closeOnEscape, closeOnOutsideClick });
  useIsomorphicLayoutEffect(() => {
    latest.current = { setOpen, initialFocus, closeOnEscape, closeOnOutsideClick };
  });

  const api = useMemo(
    () =>
      core.connect({
        state: { open, id, role },
        setOpen,
        describedBy,
        closeOnEscape,
        normalize: normalizeProps,
      }),
    [open, id, role, setOpen, describedBy, closeOnEscape],
  );

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDialogElement>(null);
  const notices = useDialogNotices(panelRef, open);

  useEffect(() => {
    if (!open) return;
    const el = panelRef.current;
    if (!el) return;

    // Capture focus before it moves into the dialog, to restore on close.
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const trigger = triggerRef.current;

    // Top layer + inert background come from the platform.
    el.showModal();
    const releaseScroll = lockScroll();

    // Native Escape: route it through our state (React unmounts the element)
    // instead of letting the platform close it out from under us.
    const onCancel = (event: Event) => {
      event.preventDefault();
      if (latest.current.closeOnEscape !== false) latest.current.setOpen(false);
    };
    // Any other native close (e.g. a `method="dialog"` form) syncs the state.
    // Only the panel's own: an element inside it can emit a bubbling `close`.
    const onClose = (event: Event) => {
      if (event.target === el) latest.current.setOpen(false);
    };
    // With the page inert, backdrop presses target the <dialog> itself; a press
    // whose coordinates fall outside the panel's box is a light dismiss.
    const onPointerDown = (event: PointerEvent) => {
      if (!latest.current.closeOnOutsideClick || event.target !== el) return;
      const rect = el.getBoundingClientRect();
      const inside =
        rect.top <= event.clientY &&
        event.clientY <= rect.bottom &&
        rect.left <= event.clientX &&
        event.clientX <= rect.right;
      if (!inside) {
        event.preventDefault();
        latest.current.setOpen(false);
      }
    };

    el.addEventListener("cancel", onCancel);
    el.addEventListener("close", onClose);
    el.addEventListener("pointerdown", onPointerDown);

    // `showModal()` focuses the first focusable; enforce our contract instead —
    // `initialFocus` when given, else the panel (never the close button).
    const target = latest.current.initialFocus
      ? el.querySelector<HTMLElement>(latest.current.initialFocus)
      : null;
    (target ?? el).focus();

    return () => {
      el.removeEventListener("cancel", onCancel);
      el.removeEventListener("close", onClose);
      el.removeEventListener("pointerdown", onPointerDown);
      if (el.open) el.close();
      releaseScroll();
      // Back to where focus was, inside a dialog below when there is one;
      // the trigger when that element is gone.
      returnFocus(previouslyFocused, trigger);
    };
  }, [open]);

  return { api, open, setOpen, triggerRef, panelRef, ...notices };
}
