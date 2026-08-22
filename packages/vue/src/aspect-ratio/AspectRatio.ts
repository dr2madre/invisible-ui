import { defineComponent, h } from "vue";

export interface AspectRatioProps {
  /** Width-to-height ratio, e.g. `16 / 9`, `4 / 3`, `1`. */
  ratio?: number;
}

/**
 * AspectRatio — constrains its content to a fixed width-to-height ratio using
 * the CSS `aspect-ratio` property, ported from the Svelte adapter.
 * Presentational only (no ARIA role): drop in an image, video, iframe or any
 * block content via the default slot, and it is cropped to fill the box.
 *
 * Radius is themeable via `--ds-aspect-ratio-radius`.
 */
export const AspectRatio = defineComponent({
  name: "AspectRatio",
  props: {
    ratio: { type: Number, default: 1 },
  },
  setup(props, { slots }) {
    return () =>
      h(
        "div",
        {
          class: "aspect-ratio",
          // A private variable: the prop always sets it inline, so an external
          // custom-property override could never win.
          style: { "--_aspect-ratio": String(props.ratio) },
          "data-aspect-ratio": "",
        },
        slots.default?.(),
      );
  },
});
