import { defineComponent, h, type PropType } from "vue";
import { useButtonGroup, type ButtonGroupOrientation } from "./use-button-group";

export type ButtonGroupAlign = "start" | "center" | "end" | "stretch";

export interface ButtonGroupProps {
  /** Accessible name for the group (required). */
  label: string;
  orientation?: ButtonGroupOrientation;
  /** Visually merge the buttons into one bar. Defaults to `true`. */
  attached?: boolean;
  /**
   * Cross-axis alignment of the items. Defaults to `center` so a taller sibling
   * (e.g. a Select with a label) keeps the buttons at their own height; use
   * `end` to line buttons up with a labelled control's input row, or `stretch`
   * for equal heights.
   */
  align?: ButtonGroupAlign;
}

const ALIGN_ITEMS: Record<ButtonGroupAlign, string> = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  stretch: "stretch",
};

/**
 * ButtonGroup — the styled, batteries-included grouping of related action
 * buttons, ported from the Svelte adapter. Semantics (a labelled
 * `role="group"` with an orientation) come from the headless button group
 * (`@design-system/core`); this layer lays the buttons out and, when
 * `attached`, joins them into a single segmented bar by collapsing the inner
 * corners and shared borders.
 *
 * Place styled `Button`s (or any `<button>`) in the default slot. The group
 * holds no selection: each button stays an independent action and an
 * independent tab stop. Give it an accessible `label`. Spacing is themeable via
 * `--ds-button-group-*`.
 */
export const ButtonGroup = defineComponent({
  name: "ButtonGroup",
  props: {
    label: { type: String, required: true },
    orientation: { type: String as PropType<ButtonGroupOrientation>, default: "horizontal" },
    attached: { type: Boolean, default: true },
    align: { type: String as PropType<ButtonGroupAlign>, default: "center" },
  },
  setup(props, { slots }) {
    const api = useButtonGroup(() => ({ label: props.label, orientation: props.orientation }));

    return () =>
      h(
        "div",
        {
          ...api.value.groupProps,
          class: [
            "button-group",
            {
              "button-group--attached": props.attached,
              "button-group--vertical": props.orientation === "vertical",
            },
          ],
          style: { alignItems: ALIGN_ITEMS[props.align] },
        },
        slots.default?.(),
      );
  },
});
