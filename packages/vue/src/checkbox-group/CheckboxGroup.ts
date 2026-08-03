import { defineComponent, h, type PropType } from "vue";
import { Icon } from "../icon/Icon";
import { useCheckboxGroup, type CheckboxGroupItem } from "./use-checkbox-group";

export interface CheckboxGroupProps {
  items: CheckboxGroupItem[];
  /** `v-model` value; takes precedence over `value` when bound. */
  modelValue?: string[];
  value?: string[];
  disabled?: boolean;
  /** Accessible name for the group (required; rendered as the legend). */
  label: string;
  /** Shared form field name; each checked item submits its value under it. */
  name?: string;
  /** Called whenever the selected values change. */
  onValueChange?: (value: string[]) => void;
}

/**
 * CheckboxGroup: the styled, batteries-included multi-select checkbox group
 * built on a native `<fieldset>` of `<input type="checkbox">` items. The
 * browser provides the group/checkbox roles, Space activation, focus and form
 * participation; this layer adds the box, the check glyph and the labels.
 *
 * A group `label` is required (rendered as the `<legend>`); each item carries
 * an optional `label` (falls back to `value`). Pass `name` to submit every
 * checked item's value under a shared field. The selection binds two ways:
 * `v-model` (a `string[]`) or the `value` prop plus `onValueChange`. Colors
 * and sizing are themeable CSS custom properties (`--ds-checkbox-*`).
 */
export const CheckboxGroup = defineComponent({
  name: "CheckboxGroup",
  props: {
    items: { type: Array as PropType<CheckboxGroupItem[]>, required: true },
    modelValue: { type: Array as PropType<string[]>, default: undefined },
    value: { type: Array as PropType<string[]>, default: () => [] },
    disabled: { type: Boolean, default: false },
    label: { type: String, required: true },
    name: { type: String, default: undefined },
    onValueChange: { type: Function as PropType<(value: string[]) => void>, default: undefined },
  },
  emits: {
    "update:modelValue": (value: string[]) => Array.isArray(value),
  },
  setup(props, { emit }) {
    const api = useCheckboxGroup(() => ({
      items: props.items,
      value: props.modelValue ?? props.value,
      disabled: props.disabled,
      name: props.name,
      onValueChange: (next: string[]) => {
        emit("update:modelValue", next);
        props.onValueChange?.(next);
      },
    }));

    return () =>
      h("fieldset", { class: "checkbox-group", ...api.value.rootProps }, [
        h("legend", { class: "checkbox-group__label" }, props.label),
        ...props.items.map((item) =>
          h(
            "label",
            {
              key: item.value,
              class: [
                "checkbox-group__item",
                { "checkbox-group__item--disabled": props.disabled || Boolean(item.disabled) },
              ],
            },
            [
              h("input", {
                ...api.value.getItemProps(item.value),
                class: "checkbox__input",
                checked: api.value.isChecked(item.value),
              }),
              // Same painted box as the standalone Checkbox, so `checkbox.css`
              // covers the visuals and both render identically.
              h("span", { class: "checkbox", "aria-hidden": "true" }, [
                h(
                  Icon,
                  { class: "checkbox__glyph checkbox__check", size: "100%", strokeWidth: 3 },
                  { default: () => h("polyline", { points: "20 6 9 17 4 12" }) },
                ),
              ]),
              h("span", { class: "field__label" }, item.label ?? item.value),
            ],
          ),
        ),
      ]);
  },
});
