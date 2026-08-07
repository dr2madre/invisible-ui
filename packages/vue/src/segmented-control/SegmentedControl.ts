import { defineComponent, h, type Component, type PropType } from "vue";
import { useStableId } from "../internal/use-stable-id";
import { useSegmentedControl, type SegmentItem } from "./use-segmented-control";

/**
 * A segment, with an optional display `label` (falls back to `value`) and an
 * optional `icon` (any Vue component, e.g. an icon library's glyph or a custom
 * `Icon` wrapper). Wrap the component in `markRaw()` so Vue keeps it out of the
 * reactive proxy it builds for the `items` prop.
 */
export type SegmentedControlItem = SegmentItem & { label?: string; icon?: Component };

export type SegmentedControlOrientation = "horizontal" | "vertical";

export interface SegmentedControlProps {
  items: SegmentedControlItem[];
  /** `v-model` value; takes precedence over `value` when bound. */
  modelValue?: string | null;
  value?: string | null;
  disabled?: boolean;
  /**
   * Layout and arrow-key axis. `horizontal` (default) is a segment bar;
   * `vertical` stacks the segments into a column (e.g. a sidebar). Each
   * segment's content stays a row (icon beside label) unless `stacked` is set.
   */
  orientation?: SegmentedControlOrientation;
  /**
   * Render only the icon for each segment, hiding the visible label (the label
   * still names the segment via `aria-label`). Items without an icon keep their
   * text.
   */
  iconOnly?: boolean;
  /**
   * Stack each segment's content vertically: icon on top, label below (e.g. an
   * iOS-style tab). Implies the label stays visible.
   */
  stacked?: boolean;
  /** Accessible name for the control (announced by screen readers). */
  label: string;
  /** Visually hide the label (kept for assistive tech). */
  hideLabel?: boolean;
  /** Form field name; the selected value is submitted under it. */
  name?: string;
  /** Called whenever the selected value changes. */
  onValueChange?: (value: string) => void;
}

// Stable per-instance id for the group label association; the same
// module-counter approach as Select (Vue's own `useId` landed after the ^3.4
// peer range).
/**
 * SegmentedControl — the styled, batteries-included segmented control, ported
 * from the Svelte adapter. A single-select group built on native
 * `<input type="radio">` items sharing a `name`, laid out as a horizontal (or
 * vertical) bar of segments. The browser provides single selection, roving
 * tabindex, arrow-key navigation, focus and form participation.
 *
 * Items may carry an optional `label`; the `value` is used when omitted. The
 * control needs an accessible name via `label`. The selected value binds two
 * ways: `v-model` or the `value` prop plus `onValueChange`. Colors are
 * themeable CSS custom properties (`--ds-segment-*`).
 */
export const SegmentedControl = defineComponent({
  name: "SegmentedControl",
  props: {
    items: { type: Array as PropType<SegmentedControlItem[]>, required: true },
    modelValue: { type: String as PropType<string | null>, default: undefined },
    value: { type: String as PropType<string | null>, default: null },
    disabled: { type: Boolean, default: false },
    orientation: {
      type: String as PropType<SegmentedControlOrientation>,
      default: "horizontal",
    },
    iconOnly: { type: Boolean, default: false },
    stacked: { type: Boolean, default: false },
    label: { type: String, required: true },
    hideLabel: { type: Boolean, default: false },
    name: { type: String, default: undefined },
    onValueChange: { type: Function as PropType<(value: string) => void>, default: undefined },
  },
  emits: {
    "update:modelValue": (value: string) => typeof value === "string",
  },
  setup(props, { emit }) {
    const labelId = useStableId("ds-segmented-label");

    const api = useSegmentedControl(() => ({
      items: props.items,
      value: props.modelValue !== undefined ? props.modelValue : props.value,
      disabled: props.disabled,
      orientation: props.orientation,
      name: props.name,
      onValueChange: (next: string) => {
        emit("update:modelValue", next);
        props.onValueChange?.(next);
      },
    }));

    return () =>
      h("div", { class: "segmented-field" }, [
        h(
          "span",
          {
            class: [
              "segmented-field__label",
              { "segmented-field__label--hidden": props.hideLabel },
            ],
            id: labelId,
          },
          props.label,
        ),
        h(
          "div",
          {
            ...api.value.rootProps,
            class: ["segmented", { "segmented--vertical": props.orientation === "vertical" }],
            "aria-labelledby": labelId,
          },
          props.items.map((item) => {
            const showLabel = props.stacked || !props.iconOnly || !item.icon;
            const text = item.label ?? item.value;

            return h(
              "label",
              {
                key: item.value,
                class: [
                  "segment",
                  {
                    "segment--icon-only": props.iconOnly && Boolean(item.icon) && !props.stacked,
                    "segment--stacked": props.stacked,
                    "segment--disabled": props.disabled || Boolean(item.disabled),
                  },
                ],
              },
              [
                h("input", {
                  ...api.value.getItemProps(item.value),
                  class: "segment__input",
                  checked: api.value.value === item.value,
                  "aria-label": showLabel ? undefined : text,
                }),
                item.icon
                  ? h("span", { class: "segment__icon", "aria-hidden": "true" }, [h(item.icon)])
                  : null,
                showLabel ? h("span", { class: "segment__label" }, text) : null,
              ],
            );
          }),
        ),
      ]);
  },
});
