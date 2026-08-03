import { defineComponent, h, type PropType } from "vue";

export type SeparatorOrientation = "horizontal" | "vertical";

export interface SeparatorProps {
  orientation?: SeparatorOrientation;
  /** Hide from assistive tech (purely visual). */
  decorative?: boolean;
}

/**
 * Separator — a thin visual divider between content or groups of controls,
 * ported from the Svelte adapter.
 *
 * Accessibility: by default it is a semantic separator (`role="separator"`
 * with `aria-orientation`). Set `decorative` when it carries no meaning (e.g.
 * purely visual spacing inside a toolbar that already groups its items) so it
 * is hidden from assistive tech.
 *
 * Color and thickness are themeable CSS custom properties (`--ds-separator-*`,
 * falling back to `--ds-color-border`).
 */
export const Separator = defineComponent({
  name: "Separator",
  props: {
    orientation: { type: String as PropType<SeparatorOrientation>, default: "horizontal" },
    decorative: { type: Boolean, default: false },
  },
  setup(props) {
    return () =>
      h("div", {
        class: "separator",
        "data-orientation": props.orientation,
        role: props.decorative ? "none" : "separator",
        "aria-orientation": props.decorative ? undefined : props.orientation,
      });
  },
});
