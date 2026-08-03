import { popover as core } from "@design-system/core";
import {
  computed,
  ref,
  toValue,
  watch,
  type ComputedRef,
  type MaybeRefOrGetter,
  type Ref,
} from "vue";
import { onOutsidePointerDown } from "../internal/dismiss";
import { attachFloating, type Placement } from "../internal/floating";
import { normalizeProps } from "../normalize";

export interface UsePopoverOptions {
  /** Initial / controlled open state. */
  open?: boolean;
  /** Preferred placement of the panel. Default `"bottom"`. */
  placement?: Placement;
  /** Gap between trigger and panel, in px. Default `6`. */
  offset?: number;
  onOpenChange?: (open: boolean) => void;
}

export interface UsePopover {
  api: ComputedRef<core.PopoverApi>;
  open: ComputedRef<boolean>;
  setOpen: (open: boolean) => void;
  /** Template ref for the trigger; the positioning anchor and Escape's focus target. */
  triggerRef: Ref<HTMLElement | null>;
  /** Template ref for the content panel. Render it only while `open`. */
  panelRef: Ref<HTMLElement | null>;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Stable per-instance ids, as in Select: a module counter keeps the Vue peer
// range at ^3.4 (Vue's own `useId` landed in 3.5).
let instanceCount = 0;

/**
 * Connect the headless Popover to Vue. Behaviour and ARIA live in
 * `@design-system/core` (open/close, `aria-haspopup`/`aria-expanded` wiring,
 * Escape to close); this composable owns the DOM concerns through the shared
 * overlay helpers: `attachFloating` (flip/shift positioning) and
 * `onOutsidePointerDown` (outside-press dismiss). Plus focus management: focus
 * moves into the panel on open (first focusable, else the panel), the popover
 * closes when focus leaves trigger + panel (non-modal semantics), and only a
 * keyboard dismiss (Escape) returns focus to the trigger.
 *
 * The panel must be rendered only while open, so the post-flush `watch` tracks
 * the open state and its cleanup runs when the panel goes away.
 */
export function usePopover(options: MaybeRefOrGetter<UsePopoverOptions> = {}): UsePopover {
  const id = `ds-popover-${++instanceCount}`;
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
    core.connect({ state: { open: open.value, id }, setOpen, normalize: normalizeProps }),
  );

  const triggerRef = ref<HTMLElement | null>(null);
  const panelRef = ref<HTMLElement | null>(null);

  watch(
    open,
    (isOpen, _previous, onCleanup) => {
      if (!isOpen) return;
      const panel = panelRef.value;
      if (!panel) return;
      const trigger = triggerRef.value;

      // Position against the trigger and keep it positioned.
      const stopFloating = trigger
        ? attachFloating(trigger, panel, {
            placement: resolved.value.placement ?? "bottom",
            offset: resolved.value.offset ?? 6,
          })
        : () => {};

      // Outside press closes (focus follows the pointer, so don't restore).
      const stopOutside = onOutsidePointerDown([trigger, panel], () => setOpen(false));

      // Non-modal: close when focus moves out of trigger + panel (don't restore).
      const onFocusIn = (event: FocusEvent) => {
        const target = event.target as Node;
        if (panel.contains(target) || trigger?.contains(target)) return;
        setOpen(false);
      };
      document.addEventListener("focusin", onFocusIn);

      // Only a keyboard dismiss (Escape) should send focus back to the
      // trigger; the core's content props do the closing.
      let restoreFocus = false;
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") restoreFocus = true;
      };
      panel.addEventListener("keydown", onKeyDown);

      // Move focus into the panel (first focusable, else the panel itself).
      (panel.querySelector<HTMLElement>(FOCUSABLE) ?? panel).focus();

      onCleanup(() => {
        stopFloating();
        stopOutside();
        document.removeEventListener("focusin", onFocusIn);
        panel.removeEventListener("keydown", onKeyDown);
        if (restoreFocus && trigger?.isConnected) trigger.focus();
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
