import { defineComponent, h, watch, type ComponentPublicInstance, type PropType } from "vue";
import { Button } from "../button/Button";
import type { ButtonVariant } from "../button/use-button";
import { ignoreGhostClicks } from "../internal/ghost-click";
import type { Placement } from "../internal/floating";
import { useHydratedTeleport } from "../internal/use-hydrated-teleport";
import { scopedTeleport } from "../internal/locale-teleport";
import { useHoverPreview } from "./use-hover-preview";
import { usePopover } from "./use-popover";
import { useI18n } from "../i18n/i18n";

export interface PopoverProps {
  /** Opening contract: an intentional click, or a hover/focus preview. */
  trigger?: "click" | "hover";
  /** Visual variant for the trigger Button (`trigger="click"` only). */
  triggerVariant?: ButtonVariant;
  /** Initial / controlled open state; bindable with `v-model:open`. */
  open?: boolean;
  /** Preferred placement of the panel. */
  placement?: Placement;
  /** Delay before opening on hover, in ms (`trigger="hover"` only). */
  openDelay?: number;
  /** Delay before closing on leave, in ms (`trigger="hover"` only). */
  closeDelay?: number;
  onOpenChange?: (open: boolean) => void;
}

/**
 * Popover: a styled, non-modal floating card anchored to a trigger. Two
 * opening contracts, one component:
 *
 * - **`trigger="click"`** (default): a Button opens it intentionally.
 *   Behaviour and accessibility (open/close, `aria-haspopup`/`aria-expanded`
 *   wiring, Escape to close) come from the headless popover
 *   (`@design-system/core`); the adapter adds Floating-UI positioning
 *   (flip/shift), outside-press + focus-leave dismissal, and focus management
 *   (focus moves into the panel on open, returns to the trigger on Escape).
 * - **`trigger="hover"`** (the pattern shipped as HoverCard in the Svelte
 *   adapter): the card previews on hover **and keyboard focus** of the slotted
 *   trigger (typically a link), with open/close delays; focus never moves into
 *   the card, and the card holds nothing focusable. The first click/tap opens
 *   the preview instead of activating the trigger; once open, the default
 *   action (e.g. link navigation) proceeds, giving touch users the popover
 *   contract. Hover content must be **supplementary**: never put essential
 *   information only in here. Interactive content belongs to
 *   `trigger="click"`.
 *
 * The open state binds two ways: `v-model:open` (the idiomatic Vue form) or
 * the `open` prop plus `onOpenChange`. Slots: `trigger` (button content, or
 * the focusable element itself in hover mode) and the default slot (the card).
 * Themeable via `--ds-popover-*`.
 */
export const Popover = defineComponent({
  name: "Popover",
  props: {
    trigger: { type: String as PropType<"click" | "hover">, default: "click" },
    triggerVariant: { type: String as PropType<ButtonVariant>, default: "default" },
    open: { type: Boolean, default: false },
    placement: { type: String as PropType<Placement>, default: "bottom" },
    openDelay: { type: Number, default: 300 },
    closeDelay: { type: Number, default: 200 },
    onOpenChange: { type: Function as PropType<(open: boolean) => void>, default: undefined },
  },
  emits: {
    "update:open": (open: boolean) => typeof open === "boolean",
  },
  setup(props, { emit, slots }) {
    const teleportDisabled = useHydratedTeleport();
    const i18n = useI18n();
    const notify = (next: boolean) => {
      emit("update:open", next);
      props.onOpenChange?.(next);
    };

    // The opening contract is chosen at setup, like the Svelte adapter: the
    // two modes wire different behaviours to different markup.
    if (props.trigger === "hover") {
      const hover = useHoverPreview(() => ({
        open: props.open,
        placement: props.placement,
        openDelay: props.openDelay,
        closeDelay: props.closeDelay,
        onOpenChange: notify,
      }));
      const { api, open, triggerRef, cardRef, show, hide, hold } = hover;

      // Touch has no hover; the tap (onClick) owns touch so it doesn't flash.
      let touch = false;
      const onPointerenter = (event: PointerEvent) => {
        if (event.pointerType === "touch") return;
        show();
      };
      const onPointerdown = (event: PointerEvent) => {
        touch = event.pointerType !== "mouse";
      };
      // First activation (a tap, or a click that beat the hover delay) shows
      // the preview instead of the trigger's own action; once open, the
      // default proceeds (e.g. the link navigates). A second tap closes, the
      // popover contract on touch, where hover does not exist.
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
            class: "popover__hover-trigger",
            onPointerenter,
            onPointerleave: () => hide(),
            onFocusin: () => show(0),
            onPointerdown,
            onClick,
          },
          slots.trigger?.(),
        ),
        open.value
          ? scopedTeleport(teleportDisabled.value, i18n.value, [
              h(
                "div",
                {
                  ...api.value.contentProps,
                  ref: cardRef,
                  class: "popover__content",
                  onPointerenter: () => hold(),
                  onPointerleave: () => hide(),
                },
                slots.default?.(),
              ),
            ])
          : null,
      ];
    }

    const { api, open, triggerRef, panelRef } = usePopover(() => ({
      open: props.open,
      placement: props.placement,
      onOpenChange: notify,
    }));

    // A template ref on a component yields its instance; the composable wants
    // the DOM node it renders, to anchor the panel and restore focus.
    const setTriggerRef = (el: Element | ComponentPublicInstance | null) => {
      const node = el && "$el" in el ? (el.$el as Element) : el;
      triggerRef.value = node instanceof HTMLElement ? node : null;
    };

    // Drop iOS's synthesized duplicate click so the popover doesn't toggle twice.
    watch(triggerRef, (node, _previous, onCleanup) => {
      if (!node) return;
      onCleanup(ignoreGhostClicks(node));
    });

    return () => [
      h(
        Button,
        { variant: props.triggerVariant, ...api.value.triggerProps, ref: setTriggerRef },
        { default: () => slots.trigger?.() ?? i18n.value.t("dialog.trigger") },
      ),
      open.value
        ? scopedTeleport(teleportDisabled.value, i18n.value, [
            h(
              "div",
              { ...api.value.contentProps, ref: panelRef, class: "popover__content" },
              slots.default?.(),
            ),
          ])
        : null,
    ];
  },
});
