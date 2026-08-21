import { defineComponent, h, type PropType } from "vue";

export interface IconProps {
  /** Rendered size; `1em` by default so icons scale with the surrounding text. */
  size?: string;
  viewBox?: string;
  /** Stroke width in viewBox units (glyphs are stroke-based by default). */
  strokeWidth?: number | string;
  /** Accessible name. When omitted the icon is decorative (`aria-hidden`). */
  label?: string;
}

/**
 * Icon: a standardized SVG wrapper, the Vue counterpart of the Svelte and
 * React adapters' `Icon`. It centralizes the boilerplate every inline `<svg>`
 * would otherwise repeat: a 24×24 viewBox, `1em` sizing, `currentColor`,
 * rounded stroke joins and accessibility. Extra classes fall through and merge
 * with the base `icon` class. The glyph itself (`<path>`, `<line>`,
 * `<polyline>`, …) goes in the default slot.
 *
 * Decorative by default; pass `label` to expose it as an image with a name.
 */
export const Icon = defineComponent({
  name: "Icon",
  props: {
    size: { type: String, default: "1em" },
    viewBox: { type: String, default: "0 0 24 24" },
    strokeWidth: { type: [Number, String] as PropType<number | string>, default: 2 },
    label: { type: String, default: undefined },
  },
  setup(props, { slots }) {
    return () =>
      h(
        "svg",
        {
          class: "icon",
          viewBox: props.viewBox,
          width: props.size,
          height: props.size,
          fill: "none",
          stroke: "currentColor",
          "stroke-width": props.strokeWidth,
          "stroke-linecap": "round",
          "stroke-linejoin": "round",
          role: props.label ? "img" : undefined,
          "aria-label": props.label,
          "aria-hidden": props.label ? undefined : "true",
          focusable: "false",
          style: { display: "inline-block", flex: "none", verticalAlign: "middle" },
        },
        slots.default?.(),
      );
  },
});

/** The plus glyph used as the Button's default leading/trailing icon. */
export const PlusGlyph = () => [
  h("line", { x1: "12", y1: "5", x2: "12", y2: "19" }),
  h("line", { x1: "5", y1: "12", x2: "19", y2: "12" }),
];

/** The tick that marks a checkable menu item as on. */
export const CheckGlyph = () => [h("polyline", { points: "20 6 9 17 4 12" })];

/** The hazard triangle that keeps `danger` from relying on colour alone. */
export const HazardGlyph = () => [
  h("path", {
    d: "M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z",
  }),
  h("line", { x1: "12", y1: "9", x2: "12", y2: "13" }),
  h("line", { x1: "12", y1: "17", x2: "12", y2: "17" }),
];
