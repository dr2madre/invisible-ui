import { defineComponent, h, type PropType } from "vue";

export type ToggleGroupVariant = "separate" | "segmented";
export type ToggleGroupOrientation = "horizontal" | "vertical";

export interface ToggleGroupProps {
  /** Visual style. `separate` keeps each toggle's own style; `segmented` joins them. */
  variant?: ToggleGroupVariant;
  /** Layout axis. Purely visual: the group has no keyboard navigation of its own. */
  orientation?: ToggleGroupOrientation;
  /**
   * Let the toggles wrap onto multiple lines when they overflow the available
   * width (e.g. a row of filter chips in a narrow panel). Meaningful on a
   * horizontal `separate` group; ignored when `segmented`, which is one control.
   */
  wrap?: boolean;
  /**
   * Optional container name for screen readers (the group's `aria-label`). It
   * names the container, not the items; omit it when the toggles are unrelated.
   */
  label?: string;
}

/**
 * ToggleGroup — a visual wrapper that arranges a set of independent
 * `ToggleButton` children and gives them a shared look, ported from the Svelte
 * adapter. It carries no selection state of its own: each ToggleButton inside
 * is a standalone on/off control (a native checkbox) that owns its own
 * `pressed` state, label and form field. Insert the toggles via the default
 * slot.
 *
 * Styles:
 * - `separate` (default): each toggle keeps its own style, spaced by a gap.
 * - `segmented`: items are joined into one control, their individual borders
 *   dropped and the group drawing a single outer border with thin dividers.
 *
 * Accessibility: the group is a `role="group"`. The optional `label` becomes
 * the group's `aria-label`, a container name (e.g. "Formatting") that gives
 * screen-reader context ("group, Formatting"); each toggle carries its own
 * name. Omit it entirely when the toggles are unrelated. Radius, spacing and
 * colors are themeable via `--ds-toggle-group-*`.
 */
export const ToggleGroup = defineComponent({
  name: "ToggleGroup",
  props: {
    variant: { type: String as PropType<ToggleGroupVariant>, default: "separate" },
    orientation: { type: String as PropType<ToggleGroupOrientation>, default: "horizontal" },
    wrap: { type: Boolean, default: false },
    label: { type: String, default: undefined },
  },
  setup(props, { slots }) {
    return () =>
      h(
        "div",
        {
          class: [
            "toggle-group",
            `toggle-group--${props.variant}`,
            { "toggle-group--wrap": props.wrap && props.variant === "separate" },
          ],
          role: "group",
          "aria-label": props.label,
          "data-orientation": props.orientation,
        },
        slots.default?.(),
      );
  },
});
