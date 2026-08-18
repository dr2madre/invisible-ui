import { defineComponent, h, ref, type PropType } from "vue";
import { Icon } from "../icon/Icon";
import { useDomProps } from "../use-dom-props";
import { useCheckbox, type CheckedState } from "./use-checkbox";

export interface CheckboxProps {
  /** Accessible, visible label (required). Override with the default slot for rich content. */
  label: string;
  /**
   * Visually hide the label while keeping it as the accessible name (for a
   * checkbox whose meaning is carried by its surroundings, e.g. a selection
   * column). The label text is always required.
   */
  hideLabel?: boolean;
  /** `v-model` value; takes precedence over `checked` when bound. */
  modelValue?: CheckedState;
  checked?: CheckedState;
  disabled?: boolean;
  /** Form field name; the value is submitted under it when checked. */
  name?: string;
  /** Value submitted with the form when checked. Defaults to the native `"on"`. */
  value?: string;
  /** Mark the control required for native form validation. */
  required?: boolean;
  /** Called whenever the checked value changes. */
  onCheckedChange?: (checked: CheckedState) => void;
}

/**
 * Checkbox: the styled checkbox built on a **native** `<input type="checkbox">`.
 * The browser provides the checkbox role, Space activation, focus and form
 * participation; this layer adds the box, the check / dash glyphs and the
 * visible label, and keeps the tri-state model
 * (`true` / `false` / `"indeterminate"`).
 *
 * The checked value binds two ways: `v-model` (the idiomatic Vue form) or the
 * `checked` prop plus `onCheckedChange`, matching the React adapter. Both
 * callbacks fire on every change.
 *
 * The input is wrapped in a `<label>`, so pressing the box or the text toggles
 * it with no extra wiring. Themeable via `--ds-checkbox-*`.
 */
export const Checkbox = defineComponent({
  name: "Checkbox",
  props: {
    label: { type: String, required: true },
    hideLabel: { type: Boolean, default: false },
    modelValue: {
      type: [Boolean, String] as PropType<CheckedState>,
      default: undefined,
    },
    checked: { type: [Boolean, String] as PropType<CheckedState>, default: false },
    disabled: { type: Boolean, default: false },
    name: { type: String, default: undefined },
    value: { type: String, default: "on" },
    required: { type: Boolean, default: false },
    onCheckedChange: {
      type: Function as PropType<(checked: CheckedState) => void>,
      default: undefined,
    },
  },
  emits: {
    "update:modelValue": (checked: CheckedState) => typeof checked !== "undefined",
  },
  setup(props, { emit, slots }) {
    const api = useCheckbox(() => ({
      checked: props.modelValue ?? props.checked,
      disabled: props.disabled,
      onCheckedChange: (next: CheckedState) => {
        emit("update:modelValue", next);
        props.onCheckedChange?.(next);
      },
    }));

    const input = ref<HTMLInputElement | null>(null);

    // Properties HTML has no attribute for (here: `indeterminate`) are declared
    // by the core and applied generically; nothing component-specific here.
    useDomProps(input, () => api.value.rootDomProps);

    return () =>
      h("label", { class: props.disabled ? "field field--disabled" : "field" }, [
        h("input", {
          ...api.value.rootProps,
          ref: input,
          class: "checkbox__input",
          name: props.name,
          value: props.value,
          required: props.required,
          checked: api.value.checked === true,
        }),
        h("span", { class: "checkbox", "aria-hidden": "true" }, [
          h(
            Icon,
            { class: "checkbox__glyph checkbox__check", size: "100%", strokeWidth: 3 },
            { default: () => h("polyline", { points: "20 6 9 17 4 12" }) },
          ),
          h(
            Icon,
            { class: "checkbox__glyph checkbox__dash", size: "100%", strokeWidth: 3 },
            { default: () => h("line", { x1: "5", y1: "12", x2: "19", y2: "12" }) },
          ),
        ]),
        h(
          "span",
          { class: ["field__label", { "field__label--hidden": props.hideLabel }] },
          slots.default ? slots.default() : props.label,
        ),
      ]);
  },
});
