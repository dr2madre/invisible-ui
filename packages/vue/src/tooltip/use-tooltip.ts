import { tooltip as core } from "@design-system/core";
import {
  computed,
  ref,
  toValue,
  type ComputedRef,
  type MaybeRefOrGetter,
  type Ref,
  watch,
} from "vue";
import { useDelayedToggle } from "../internal/delayed-toggle";
import { attachFloating, type Placement } from "../internal/floating";
import { normalizeProps } from "../normalize";
import { useStableId } from "../internal/use-stable-id";

export interface UseTooltipOptions {
  /** Preferred placement. Default `"top"`. */
  placement?: Placement;
  /** Gap between trigger and tooltip, in px. Default `6`. */
  offset?: number;
  /** Delay before showing on hover, in ms. Default `300`. */
  openDelay?: number;
  /** Delay before hiding on leave, in ms. Default `100`. */
  closeDelay?: number;
  onOpenChange?: (open: boolean) => void;
}

export interface UseTooltip {
  api: ComputedRef<core.TooltipApi>;
  open: ComputedRef<boolean>;
  /** Template ref for the trigger element; the positioning anchor. */
  triggerRef: Ref<HTMLElement | null>;
  /** Template ref for the tooltip element. Render it only while `open`. */
  tooltipRef: Ref<HTMLElement | null>;
  /** Show after `delay` ms (default the open delay); cancels a pending hide. */
  show: (delay?: number) => void;
  /** Hide after `delay` ms (default the close delay); cancels a pending show. */
  hide: (delay?: number) => void;
  /** Cancel pending timers, keeping the current state (hoverable content). */
  hold: () => void;
}

/**
 * Connect the headless Tooltip to Vue. ARIA lives in `@design-system/core`
 * (`role="tooltip"`, `aria-describedby` linkage); this composable owns the DOM
 * concerns: open/close delays, `attachFloating` positioning (flip/shift), and
 * WCAG 1.4.13 "content on hover" semantics. The tooltip stays open while
 * hovered (the component wires the tooltip's own pointer events to `hold`/
 * `hide`) and Escape hides it immediately, even while hovering. Focus is never
 * moved into the tooltip.
 *
 * The component wires the trigger's hover/focus events to `show`/`hide`; the
 * Escape listener is attached by the post-flush `watch` while open.
 */
export function useTooltip(options: MaybeRefOrGetter<UseTooltipOptions> = {}): UseTooltip {
  const id = useStableId("ds-tooltip");
  const resolved = computed(() => toValue(options));
  const open = ref(false);

  const setOpen = (next: boolean) => {
    if (open.value === next) return;
    open.value = next;
    resolved.value.onOpenChange?.(next);
  };

  const api = computed(() =>
    core.connect({ state: { open: open.value, id }, normalize: normalizeProps }),
  );

  const triggerRef = ref<HTMLElement | null>(null);
  const tooltipRef = ref<HTMLElement | null>(null);

  const { show, hide, hold } = useDelayedToggle(
    setOpen,
    () => resolved.value.openDelay ?? 300,
    () => resolved.value.closeDelay ?? 100,
  );

  // Position against the trigger, again whenever the placement or offset
  // changes while open.
  watch(
    () =>
      [
        open.value ? tooltipRef.value : null,
        resolved.value.placement ?? "top",
        resolved.value.offset ?? 6,
      ] as const,
    ([tip, placement, offset], _previous, onCleanup) => {
      const trigger = triggerRef.value;
      if (!tip || !trigger) return;
      onCleanup(attachFloating(trigger, tip, { placement, offset }));
    },
    { flush: "post" },
  );

  watch(
    open,
    (isOpen, _previous, onCleanup) => {
      if (!isOpen || !tooltipRef.value) return;

      // Dismissable: Escape hides immediately, even while hovering.
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") hide(0);
      };
      document.addEventListener("keydown", onKeyDown);

      onCleanup(() => {
        document.removeEventListener("keydown", onKeyDown);
        hold();
      });
    },
    { flush: "post" },
  );

  return {
    api,
    open: computed(() => open.value),
    triggerRef,
    tooltipRef,
    show,
    hide,
    hold,
  };
}
