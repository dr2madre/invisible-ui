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
import { ignoreGhostClicks } from "../internal/ghost-click";
import { normalizeProps } from "../normalize";
import { useStableId } from "../internal/use-stable-id";

export interface UsePopoverOptions {
  /** Initial / controlled open state. */
  open?: boolean;
  /** Preferred placement of the panel. Default `"bottom"`. */
  placement?: Placement;
  /** Gap between trigger and panel, in px. Default `6`. */
  offset?: number;
  /** Name for the panel. Defaults to being named by the trigger. */
  label?: string;
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
 * The panel must be rendered only while open, so the post-flush watches track
 * the panel element and their cleanup runs when it goes away.
 */
export function usePopover(options: MaybeRefOrGetter<UsePopoverOptions> = {}): UsePopover {
  const id = useStableId("ds-popover");
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
      state: { open: open.value, id },
      setOpen,
      label: resolved.value.label,
      normalize: normalizeProps,
    }),
  );

  const triggerRef = ref<HTMLElement | null>(null);
  const panelRef = ref<HTMLElement | null>(null);

  // Drop iOS's synthesized duplicate click so the popover doesn't toggle twice.
  // Synchronous, so the guard is in place as soon as the trigger renders.
  watch(
    triggerRef,
    (node, _previous, onCleanup) => {
      if (!node) return;
      onCleanup(ignoreGhostClicks(node));
    },
    { flush: "sync" },
  );

  // Position against the trigger and keep it positioned. A watch of its own,
  // so a placement or offset changed while open moves the panel without
  // running the focus handling below again.
  watch(
    () =>
      [
        open.value ? panelRef.value : null,
        resolved.value.placement ?? "bottom",
        resolved.value.offset ?? 6,
      ] as const,
    ([panel, placement, offset], _previous, onCleanup) => {
      const trigger = triggerRef.value;
      if (!panel || !trigger) return;
      onCleanup(attachFloating(trigger, panel, { placement, offset }));
    },
    { flush: "post" },
  );

  // The effect keys on the panel element, not the open flag: a popover
  // mounted with `open: true` assigns the template ref only after this
  // composable ran, so a watch on `open` alone would find no element. The
  // panel is present only while open, so the cleanup runs when it goes away.
  watch(
    () => (open.value ? panelRef.value : null),
    (panel, _previous, onCleanup) => {
      if (!panel) return;
      const trigger = triggerRef.value;

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
      // trigger; the core's content props do the closing. Capture phase, so
      // the flag is set before the close handler can tear the panel down.
      let restoreFocus = false;
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") restoreFocus = true;
      };
      panel.addEventListener("keydown", onKeyDown, true);

      // Move focus into the panel (first focusable, else the panel itself).
      (panel.querySelector<HTMLElement>(FOCUSABLE) ?? panel).focus();

      onCleanup(() => {
        stopOutside();
        document.removeEventListener("focusin", onFocusIn);
        panel.removeEventListener("keydown", onKeyDown, true);
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
