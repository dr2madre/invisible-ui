import { hoverCard as core } from "@design-system/core";
import {
  computed,
  ref,
  watch,
  type ComputedRef,
  type MaybeRefOrGetter,
  type Ref,
  toValue,
} from "vue";
import { attachFloating, type Placement } from "../internal/floating";
import { normalizeProps } from "../normalize";
import { useStableId } from "../internal/use-stable-id";

export interface UseHoverPreviewOptions {
  /** Initial / controlled open state. */
  open?: boolean;
  /** Preferred placement of the card. Default `"bottom"`. */
  placement?: Placement;
  /** Gap between trigger and card, in px. Default `8`. */
  offset?: number;
  /** Delay before opening on hover, in ms. Default `300`. */
  openDelay?: number;
  /** Delay before closing on leave, in ms. Default `200`. */
  closeDelay?: number;
  onOpenChange?: (open: boolean) => void;
}

export interface UseHoverPreview {
  api: ComputedRef<core.HoverCardApi>;
  open: ComputedRef<boolean>;
  setOpen: (open: boolean) => void;
  /** Template ref for the trigger wrapper; the positioning anchor. */
  triggerRef: Ref<HTMLElement | null>;
  /** Template ref for the card. Render it only while `open`. */
  cardRef: Ref<HTMLElement | null>;
  /** Open after `delay` ms (default the open delay); cancels a pending hide. */
  show: (delay?: number) => void;
  /** Close after `delay` ms (default the close delay); cancels a pending show. */
  hide: (delay?: number) => void;
  /** Cancel pending timers, keeping the current state (hoverable content). */
  hold: () => void;
}

// Stable per-instance ids, as in Select: a module counter keeps the Vue peer
// range at ^3.4 (Vue's own `useId` landed in 3.5).
/**
 * The hover/focus preview behaviour behind `Popover`'s `trigger="hover"` mode
 * (the pattern shipped as HoverCard in the Svelte adapter). ARIA/state live in
 * `@design-system/core`; this composable owns the DOM concerns: open/close on
 * hover **and** focus with delays, `attachFloating` positioning, and, since the
 * card is non-modal and supplementary, it stays open while the pointer is over
 * the card (hoverable), closes when focus leaves both the trigger and the
 * card, and is Escape-dismissable. Focus is never moved into the card; the
 * card holds nothing focusable.
 *
 * The component wires the trigger's pointer/focus events to `show`/`hide`; the
 * card-side listeners (hoverable, focus-leave, Escape) are attached by the
 * post-flush `watch` while open.
 */
export function useHoverPreview(
  options: MaybeRefOrGetter<UseHoverPreviewOptions> = {},
): UseHoverPreview {
  const id = useStableId("ds-hover-preview");
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
    core.connect({ state: { open: open.value, id }, normalize: normalizeProps }),
  );

  const triggerRef = ref<HTMLElement | null>(null);
  const cardRef = ref<HTMLElement | null>(null);

  let showTimer: ReturnType<typeof setTimeout> | undefined;
  let hideTimer: ReturnType<typeof setTimeout> | undefined;

  const hold = () => {
    clearTimeout(showTimer);
    clearTimeout(hideTimer);
  };
  const show = (delay = resolved.value.openDelay ?? 300) => {
    hold();
    if (delay <= 0) return setOpen(true);
    showTimer = setTimeout(() => setOpen(true), delay);
  };
  const hide = (delay = resolved.value.closeDelay ?? 200) => {
    hold();
    if (delay <= 0) return setOpen(false);
    hideTimer = setTimeout(() => setOpen(false), delay);
  };

  watch(
    open,
    (isOpen, _previous, onCleanup) => {
      if (!isOpen) return;
      const card = cardRef.value;
      if (!card) return;
      const trigger = triggerRef.value;

      const stopFloating = trigger
        ? attachFloating(trigger, card, {
            placement: resolved.value.placement ?? "bottom",
            offset: resolved.value.offset ?? 8,
          })
        : () => {};

      // Hoverable: keep open while the pointer is over the card.
      const onEnter = () => hold();
      const onLeave = () => hide();
      card.addEventListener("pointerenter", onEnter);
      card.addEventListener("pointerleave", onLeave);

      // Close when focus moves outside both the trigger and the card.
      const onFocusIn = (event: FocusEvent) => {
        const target = event.target as Node;
        if (card.contains(target) || trigger?.contains(target)) return;
        hide(0);
      };
      document.addEventListener("focusin", onFocusIn);

      // Escape closes; if focus was inside the card, return it to the trigger.
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key !== "Escape") return;
        const restore = card.contains(document.activeElement);
        hide(0);
        if (restore && trigger?.isConnected) {
          const focusable = trigger.querySelector<HTMLElement>(
            'a[href], button, input, [tabindex]:not([tabindex="-1"])',
          );
          (focusable ?? trigger).focus();
        }
      };
      document.addEventListener("keydown", onKeyDown);

      onCleanup(() => {
        stopFloating();
        card.removeEventListener("pointerenter", onEnter);
        card.removeEventListener("pointerleave", onLeave);
        document.removeEventListener("focusin", onFocusIn);
        document.removeEventListener("keydown", onKeyDown);
        hold();
      });
    },
    { flush: "post" },
  );

  return {
    api,
    open: computed(() => open.value),
    setOpen,
    triggerRef,
    cardRef,
    show,
    hide,
    hold,
  };
}
