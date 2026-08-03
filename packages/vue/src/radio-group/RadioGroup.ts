import { defineComponent, h, type PropType } from "vue";
import { useRadioGroup, type RadioGroupOrientation, type RadioItem } from "./use-radio-group";

/** An item, with an optional display label (falls back to `value`). */
export type RadioGroupItem = RadioItem & { label?: string };

export interface RadioGroupProps {
  items: RadioGroupItem[];
  /** `v-model` value; takes precedence over `value` when bound. */
  modelValue?: string | null;
  value?: string | null;
  disabled?: boolean;
  /** Layout and arrow-key axis. Defaults to `vertical`. */
  orientation?: RadioGroupOrientation;
  /** Accessible name for the group (announced by screen readers). */
  label: string;
  /** Form field name; the selected value is submitted under it. */
  name?: string;
  /** Called whenever the selected value changes. */
  onValueChange?: (value: string) => void;
}

// Stable per-instance id for the group label association; same module-counter
// approach as Select (Vue's own `useId` landed after the ^3.4 peer range).
let instanceCount = 0;

/**
 * RadioGroup: the styled, batteries-included radio group built on **native**
 * `<input type="radio">` items sharing a `name`. The browser provides single
 * selection, roving tabindex, arrow-key navigation, focus and form
 * participation (the selected value is submitted under `name`); this layer
 * adds the dot indicator and a vertical or horizontal layout.
 *
 * Items may carry an optional `label`; the `value` is used when omitted. The
 * group needs an accessible name via `label`. The selected value binds two
 * ways: `v-model` or the `value` prop plus `onValueChange`. Colors are
 * themeable CSS custom properties (`--ds-radio-*`).
 */
export const RadioGroup = defineComponent({
  name: "RadioGroup",
  props: {
    items: { type: Array as PropType<RadioGroupItem[]>, required: true },
    modelValue: { type: String as PropType<string | null>, default: undefined },
    value: { type: String as PropType<string | null>, default: null },
    disabled: { type: Boolean, default: false },
    orientation: { type: String as PropType<RadioGroupOrientation>, default: "vertical" },
    label: { type: String, required: true },
    name: { type: String, default: undefined },
    onValueChange: { type: Function as PropType<(value: string) => void>, default: undefined },
  },
  emits: {
    "update:modelValue": (value: string) => typeof value === "string",
  },
  setup(props, { emit }) {
    const labelId = `ds-radio-group-label-${++instanceCount}`;

    const api = useRadioGroup(() => ({
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
      h("div", { class: "radio-field" }, [
        h("span", { class: "radio-field__label", id: labelId }, props.label),
        h(
          "div",
          { class: "radio-group", ...api.value.rootProps, "aria-labelledby": labelId },
          props.items.map((item) =>
            h(
              "label",
              {
                key: item.value,
                class: ["radio", { "radio--disabled": props.disabled || Boolean(item.disabled) }],
              },
              [
                h("input", {
                  ...api.value.getItemProps(item.value),
                  class: "radio__input",
                  checked: api.value.value === item.value,
                }),
                h("span", { class: "radio__dot", "aria-hidden": "true" }),
                h("span", { class: "radio__label" }, item.label ?? item.value),
              ],
            ),
          ),
        ),
      ]);
  },
});
