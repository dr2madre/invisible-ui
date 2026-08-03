import { defineComponent, h, type PropType } from "vue";

export interface SkeletonProps {
  variant?: "text" | "circle" | "rect";
  /** Number of lines for the `text` variant. */
  lines?: number;
  /** Any CSS length (e.g. "12rem", "100%"). For `circle`, also sets height. */
  width?: string;
  /** Any CSS length. Ignored by `text` (uses line height). */
  height?: string;
  /** Border radius override (any CSS length). */
  radius?: string;
  /** Shimmer animation. Defaults to `pulse`. */
  animation?: "pulse" | "wave" | "none";
  /** When set, the skeleton becomes a polite status with this accessible name. */
  label?: string;
}

/**
 * Skeleton — a loading placeholder that mirrors the shape of content while it
 * loads, ported from the Svelte adapter. Three shapes: `text` (one or more
 * lines; the last is shortened), `circle` (e.g. an avatar) and `rect` (e.g.
 * an image or card).
 *
 * Accessibility: a skeleton is purely visual, so by default it is hidden from
 * assistive tech (`aria-hidden`) — announce the loading state on the
 * surrounding region (e.g. `aria-busy="true"`). Alternatively pass a `label`
 * to make this element a polite `role="status"` that announces (e.g.)
 * "Loading…".
 *
 * Sizing is set via `width`/`height` (any CSS length); for `text` the height
 * follows the line height. The shimmer is themeable via `--ds-skeleton-*` and
 * respects `prefers-reduced-motion`.
 */
export const Skeleton = defineComponent({
  name: "Skeleton",
  props: {
    variant: { type: String as PropType<"text" | "circle" | "rect">, default: "text" },
    lines: { type: Number, default: 1 },
    width: { type: String, default: undefined },
    height: { type: String, default: undefined },
    radius: { type: String, default: undefined },
    animation: { type: String as PropType<"pulse" | "wave" | "none">, default: "pulse" },
    label: { type: String, default: undefined },
  },
  setup(props) {
    return () => {
      const bars =
        props.variant === "text"
          ? Array.from({ length: Math.max(1, props.lines) }, (_, i) =>
              h("span", {
                key: i,
                class: "skeleton__bar skeleton__line",
                style: {
                  width: i === props.lines - 1 && props.lines > 1 ? "60%" : props.width,
                  borderRadius: props.radius,
                },
              }),
            )
          : [
              h("span", {
                class: ["skeleton__bar", { skeleton__circle: props.variant === "circle" }],
                style: {
                  width: props.width,
                  height: props.variant === "circle" ? (props.width ?? props.height) : props.height,
                  borderRadius: props.radius,
                },
              }),
            ];

      return h(
        "div",
        {
          class: "skeleton",
          "data-variant": props.variant,
          "data-animation": props.animation,
          role: props.label ? "status" : undefined,
          "aria-label": props.label,
          "aria-busy": props.label ? "true" : undefined,
          "aria-hidden": props.label ? undefined : "true",
        },
        bars,
      );
    };
  },
});
