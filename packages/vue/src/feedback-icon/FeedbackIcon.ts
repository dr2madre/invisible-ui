import { defineComponent, h, type PropType, type VNodeChild } from "vue";
import { Icon } from "../icon/Icon";

export type FeedbackStatus = "info" | "success" | "warning" | "danger" | "neutral";

export interface FeedbackIconProps {
  /** Feedback status: `info` | `success` | `warning` | `danger` | `neutral`. */
  status?: FeedbackStatus;
  /** Accessible name. When omitted the box is decorative (`aria-hidden`). */
  label?: string;
  /**
   * Box treatment behind the glyph:
   * - `"tint"` (default): a soft status-colored chip.
   * - `"transparent"`: no box — just the colored glyph. Use on already-tinted
   *   surfaces (e.g. inside a colored InlineNotification) so the chip doesn't
   *   clash.
   * - `"solid"`: a full status-colored box with a contrasting (white) glyph.
   */
  box?: "tint" | "transparent" | "solid";
  /** Box shape — `"rounded"` (default) or a full `"round"` circle. */
  shape?: "rounded" | "round";
}

/** Built-in glyph per status. */
const glyphs: Record<FeedbackStatus, () => VNodeChild> = {
  success: () =>
    h(
      Icon,
      { size: "100%", strokeWidth: 2.5 },
      { default: () => [h("polyline", { points: "20 6 9 17 4 12" })] },
    ),
  warning: () =>
    h(
      Icon,
      { size: "100%" },
      {
        default: () => [
          h("path", {
            d: "M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z",
          }),
          h("line", { x1: "12", y1: "9", x2: "12", y2: "13" }),
          h("line", { x1: "12", y1: "17", x2: "12", y2: "17" }),
        ],
      },
    ),
  // danger = an octagon (stop sign) with an ×, distinct from the round info
  danger: () =>
    h(
      Icon,
      { size: "100%" },
      {
        default: () => [
          h("polygon", {
            points: "7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86",
          }),
          h("line", { x1: "15", y1: "9", x2: "9", y2: "15" }),
          h("line", { x1: "9", y1: "9", x2: "15", y2: "15" }),
        ],
      },
    ),
  // neutral = a tip / suggestion (lightbulb)
  neutral: () =>
    h(
      Icon,
      { size: "100%" },
      {
        default: () => [
          h("path", { d: "M9 18h6" }),
          h("path", { d: "M10 22h4" }),
          h("path", {
            d: "M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14",
          }),
        ],
      },
    ),
  info: () =>
    h(
      Icon,
      { size: "100%" },
      {
        default: () => [
          h("circle", { cx: "12", cy: "12", r: "10" }),
          h("line", { x1: "12", y1: "11", x2: "12", y2: "16" }),
          h("line", { x1: "12", y1: "8", x2: "12", y2: "8" }),
        ],
      },
    ),
};

/**
 * FeedbackIcon — a status icon enclosed in a rounded, colored box (the
 * "system icon" look), ported from the Svelte adapter. It conveys the *type*
 * of feedback (info / success / warning / danger / neutral) at a glance, which
 * is an accessibility aid for notifications and similar messages.
 *
 * This is intentionally a *styled* component (it ships SVGs + CSS), unlike the
 * headless primitives. Colors are CSS custom properties (`--ds-feedback-*`)
 * with sensible defaults, so they remain themeable.
 *
 * A built-in icon is provided per status; pass your own via the default slot
 * to override it. The box is decorative by default (`aria-hidden`); pass
 * `label` to expose it as an image with an accessible name.
 */
export const FeedbackIcon = defineComponent({
  name: "FeedbackIcon",
  props: {
    status: { type: String as PropType<FeedbackStatus>, default: "info" },
    label: { type: String, default: undefined },
    box: { type: String as PropType<"tint" | "transparent" | "solid">, default: "tint" },
    shape: { type: String as PropType<"rounded" | "round">, default: "rounded" },
  },
  setup(props, { slots }) {
    return () =>
      h(
        "span",
        {
          class: "feedback-icon",
          "data-status": props.status,
          "data-box": props.box,
          "data-shape": props.shape,
          role: props.label ? "img" : undefined,
          "aria-label": props.label,
          "aria-hidden": props.label ? undefined : "true",
        },
        slots.default ? slots.default() : [glyphs[props.status]()],
      );
  },
});
