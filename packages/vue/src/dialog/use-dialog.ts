import { dialog as core } from "@design-system/core";
import {
  computed,
  ref,
  toValue,
  watch,
  type ComputedRef,
  type MaybeRefOrGetter,
  type Ref,
} from "vue";
import { lockScroll } from "../internal/scroll-lock";
import { normalizeProps } from "../normalize";

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
   * omitted, focus lands on the panel itself, never on the close button, so a
   * screen reader announces the dialog without snapping focus to a "✕".
   */
  initialFocus?: string;
  onOpenChange?: (open: boolean) => void;
}

export interface UseDialog {
  api: ComputedRef<core.DialogApi>;
  open: ComputedRef<boolean>;
  setOpen: (open: boolean) => void;
  /** Template ref for the trigger; used to restore focus on close. */
  triggerRef: Ref<HTMLElement | null>;
  /** Template ref for the `<dialog>` panel. Render it only while `open`. */
  panelRef: Ref<HTMLDialogElement | null>;
}

// Stable per-instance ids, as in Select: a module counter keeps the Vue peer
// range at ^3.4 (Vue's own `useId` landed in 3.5).
let instanceCount = 0;

/**
 * Connect the headless Dialog to Vue on the native `<dialog>` element
 * (ADR 0005).
 *
 * Behaviour and ARIA live in `@design-system/core` (role, `aria-modal`,
 * labelling, Escape). Modality comes from the platform via `showModal()`: top
 * layer (no teleport, no z-index), an inert background (a real focus trap the
 * browser enforces for keyboard *and* assistive tech) and a stylable
 * `::backdrop`. This composable adds only what the platform leaves out: body
 * scroll lock, backdrop light-dismiss, initial focus and focus restore.
 *
 * The panel must be rendered only while open, so the post-flush `watch` tracks
 * the panel element itself (assigned while open, including a mount that starts
 * open) and its cleanup runs when the panel goes away, the Vue counterpart of
 * the React effect's lifecycle.
 */
export function useDialog(options: MaybeRefOrGetter<UseDialogOptions> = {}): UseDialog {
  const id = `ds-dialog-${++instanceCount}`;
  const resolved = computed(() => toValue(options));
  const open = ref(resolved.value.open ?? false);

  // Mirror an externally controlled `open`.
  watch(
    () => resolved.value.open ?? false,
    (next) => {
      open.value = next;
    },
  );

  const setOpen = (next: boolean) => {
    if (open.value === next) return;
    open.value = next;
    resolved.value.onOpenChange?.(next);
  };

  const api = computed(() =>
    core.connect({
      state: { open: open.value, id, role: resolved.value.role ?? "dialog" },
      setOpen,
      describedBy: resolved.value.describedBy ?? false,
      closeOnEscape: resolved.value.closeOnEscape ?? true,
      normalize: normalizeProps,
    }),
  );

  const triggerRef = ref<HTMLElement | null>(null);
  const panelRef = ref<HTMLDialogElement | null>(null);

  // The effect keys on the panel element, not the open flag: a component
  // mounted with `open: true` assigns the template ref only after this
  // composable ran, so a watch on `open` alone would find no element and skip
  // `showModal()` until the state changed. Watching the element (present only
  // while open) makes mount-time open behave like any later open; the cleanup
  // still runs when the panel goes away.
  watch(
    () => (open.value ? panelRef.value : null),
    (el, _previous, onCleanup) => {
      if (!el) return;

      // Capture focus before it moves into the dialog, to restore on close.
      const previouslyFocused = document.activeElement as HTMLElement | null;

      // Top layer + inert background come from the platform.
      el.showModal();
      const releaseScroll = lockScroll();

      // Native Escape: route it through our state (Vue unmounts the element)
      // instead of letting the platform close it out from under us.
      const onCancel = (event: Event) => {
        event.preventDefault();
        if (resolved.value.closeOnEscape !== false) setOpen(false);
      };
      // Any other native close (e.g. a `method="dialog"` form) syncs the state.
      const onClose = () => setOpen(false);
      // With the page inert, backdrop presses target the <dialog> itself; a
      // press whose coordinates fall outside the panel's box is a light
      // dismiss.
      const onPointerDown = (event: PointerEvent) => {
        if (resolved.value.closeOnOutsideClick === false || event.target !== el) return;
        const rect = el.getBoundingClientRect();
        const inside =
          rect.top <= event.clientY &&
          event.clientY <= rect.bottom &&
          rect.left <= event.clientX &&
          event.clientX <= rect.right;
        if (!inside) setOpen(false);
      };

      el.addEventListener("cancel", onCancel);
      el.addEventListener("close", onClose);
      el.addEventListener("pointerdown", onPointerDown);

      // `showModal()` focuses the first focusable; enforce our contract
      // instead: `initialFocus` when given, else the panel (never the close
      // button).
      const target = resolved.value.initialFocus
        ? el.querySelector<HTMLElement>(resolved.value.initialFocus)
        : null;
      (target ?? el).focus();

      onCleanup(() => {
        el.removeEventListener("cancel", onCancel);
        el.removeEventListener("close", onClose);
        el.removeEventListener("pointerdown", onPointerDown);
        if (el.open) el.close();
        releaseScroll();
        // Return focus to where it was (the trigger, usually).
        const restore = triggerRef.value ?? previouslyFocused;
        if (restore?.isConnected) restore.focus();
      });
    },
    { flush: "post" },
  );

  return {
    api,
    open: computed(() => open.value),
    setOpen,
    triggerRef,
    panelRef,
  };
}
