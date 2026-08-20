import { defineComponent, h, type PropType } from "vue";
import type { Placement } from "../internal/floating";
import { useHydratedTeleport } from "../internal/use-hydrated-teleport";
import { scopedTeleport } from "../internal/locale-teleport";
import { useTooltip } from "./use-tooltip";
import { useI18n } from "../i18n/i18n";

export interface TooltipProps {
  /** Tooltip label text. */
  text: string;
  placement?: Placement;
  openDelay?: number;
  closeDelay?: number;
}

/**
 * Tooltip: a styled descriptive label shown on hover/focus of a trigger
 * (WAI-ARIA `role="tooltip"` linked via `aria-describedby`). Behaviour comes
 * from the headless tooltip (`@design-system/core`); the adapter adds open/
 * close delays, Floating-UI positioning (flip/shift), and WCAG 1.4.13 "content
 * on hover" semantics (hoverable + Escape-dismissable). On touch, where hover
 * does not exist, a tap toggles the tooltip.
 *
 * The default slot is the trigger (wrap a focusable element); `text` is the
 * tooltip label. For precise control (e.g. putting `aria-describedby` on your
 * own element), use the headless `useTooltip` instead. Themeable via
 * `--ds-tooltip-*`.
 */
export const Tooltip = defineComponent({
  name: "Tooltip",
  props: {
    text: { type: String, required: true },
    placement: { type: String as PropType<Placement>, default: "top" },
    openDelay: { type: Number, default: 300 },
    closeDelay: { type: Number, default: 100 },
  },
  setup(props, { slots }) {
    const i18n = useI18n();
    const teleportDisabled = useHydratedTeleport();
    const { api, open, triggerRef, tooltipRef, show, hide, hold } = useTooltip(() => ({
      placement: props.placement,
      openDelay: props.openDelay,
      closeDelay: props.closeDelay,
    }));

    // Touch has no hover; the tap (onClick) owns touch so it doesn't flash.
    let touch = false;
    const onPointerenter = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      show();
    };
    const onPointerdown = (event: PointerEvent) => {
      touch = event.pointerType !== "mouse";
    };
    const onClick = () => {
      if (!touch) return;
      if (open.value) hide(0);
      else show(0);
    };

    return () => [
      h(
        "span",
        {
          ...api.value.triggerProps,
          ref: triggerRef,
          class: "tooltip__trigger",
          onPointerenter,
          onPointerleave: () => hide(),
          onFocusin: () => show(0), // keyboard focus shows immediately
          onFocusout: () => hide(0),
          onPointerdown,
          onClick,
        },
        slots.default?.(),
      ),
      open.value
        ? scopedTeleport(teleportDisabled.value, i18n.value, triggerRef.value, [
            h(
              "div",
              {
                ...api.value.tooltipProps,
                ref: tooltipRef,
                class: "tooltip__content",
                // Hoverable: keep open while the pointer is over the tooltip.
                onPointerenter: () => hold(),
                onPointerleave: () => hide(),
              },
              props.text,
            ),
          ])
        : null,
    ];
  },
});
