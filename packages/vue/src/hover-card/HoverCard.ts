import { defineComponent, h, Teleport, type PropType } from "vue";
import type { Placement } from "../internal/floating";
import { useHydratedTeleport } from "../internal/use-hydrated-teleport";
import { useHoverPreview } from "../popover/use-hover-preview";

export interface HoverCardProps {
  /** Open state; bindable with `v-model:open`. */
  open?: boolean;
  /** Preferred placement of the card. */
  placement?: Placement;
  /** Gap between trigger and card, in px. */
  offset?: number;
  /** Delay before opening on hover, in ms. */
  openDelay?: number;
  /** Delay before closing on leave, in ms. */
  closeDelay?: number;
  onOpenChange?: (open: boolean) => void;
}

/**
 * HoverCard: a non-modal card previewing supplementary content for a trigger,
 * typically a link. It opens on hover **and** keyboard focus with open/close
 * delays, stays open while the pointer is over the card, closes when focus
 * leaves trigger and card, and is Escape-dismissable. Focus never moves into
 * the card, so Tab reaches its links naturally.
 *
 * State and ARIA come from the headless hover card (`@design-system/core`)
 * through `useHoverPreview`, the composable this component shares with
 * `Popover`'s `trigger="hover"` mode; positioning (flip/shift, stays attached
 * on scroll) is handled via `@floating-ui/dom`.
 *
 * Hover content must be supplementary: keep essential information out of it.
 * The open state binds two ways: `v-model:open` or the `open` prop plus
 * `onOpenChange`. Slots: `trigger` (the focusable element) and the default
 * slot (the card). Themeable via `--ds-hover-card-*`.
 */
export const HoverCard = defineComponent({
  name: "HoverCard",
  props: {
    open: { type: Boolean, default: false },
    placement: { type: String as PropType<Placement>, default: "bottom" },
    offset: { type: Number, default: 8 },
    openDelay: { type: Number, default: 300 },
    closeDelay: { type: Number, default: 200 },
    onOpenChange: { type: Function as PropType<(open: boolean) => void>, default: undefined },
  },
  emits: {
    "update:open": (open: boolean) => typeof open === "boolean",
  },
  setup(props, { emit, slots }) {
    const teleportDisabled = useHydratedTeleport();
    const { api, open, triggerRef, cardRef, show, hide, hold } = useHoverPreview(() => ({
      open: props.open,
      placement: props.placement,
      offset: props.offset,
      openDelay: props.openDelay,
      closeDelay: props.closeDelay,
      onOpenChange: (next: boolean) => {
        emit("update:open", next);
        props.onOpenChange?.(next);
      },
    }));

    // Touch has no hover; the tap (onClick) owns touch so the card doesn't
    // flash open and closed on a single press.
    let touch = false;
    const onPointerenter = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      show();
    };
    const onPointerdown = (event: PointerEvent) => {
      touch = event.pointerType !== "mouse";
    };
    // The first activation (a tap, or a click that beat the hover delay) shows
    // the card instead of running the trigger's own action; once open, the
    // default proceeds (e.g. the link navigates). A second tap closes.
    const onClick = (event: MouseEvent) => {
      if (!open.value) {
        event.preventDefault();
        show(0);
      } else if (touch) {
        hide(0);
      }
    };

    return () => [
      // The wrapper carries the hover/focus listeners; the slotted element
      // (typically a link) stays the focusable trigger.
      h(
        "span",
        {
          ...api.value.triggerProps,
          ref: triggerRef,
          class: "hover-card__trigger",
          onPointerenter,
          onPointerleave: () => hide(),
          onFocusin: () => show(0),
          onPointerdown,
          onClick,
        },
        slots.trigger?.(),
      ),
      open.value
        ? h(Teleport, { to: "body", disabled: teleportDisabled.value }, [
            h(
              "div",
              {
                ...api.value.contentProps,
                ref: cardRef,
                class: "hover-card__content",
                onPointerenter: () => hold(),
                onPointerleave: () => hide(),
              },
              slots.default?.(),
            ),
          ])
        : null,
    ];
  },
});
