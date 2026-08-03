import { defineComponent, h, type PropType } from "vue";

export interface RadioProps {
  /** The value submitted / reported when this radio is chosen. */
  value: string;
  /** Group name; radios sharing a name are mutually exclusive. */
  name: string;
  /** Whether this radio is selected. */
  checked?: boolean;
  disabled?: boolean;
  /** Label text, used when the default slot is empty. */
  label?: string;
  /** Called with this radio's value when it becomes selected. */
  onChange?: (value: string) => void;
}

// Stable per-instance id for the label association; the same module-counter
// approach as Select (Vue's own `useId` landed after the ^3.4 peer range).
let instanceCount = 0;

/**
 * Radio — a single styled radio button paired with its label, ported from the
 * Svelte adapter. Built on a native `<input type="radio">`, so several `Radio`s
 * sharing the same `name` form one group automatically (native keyboard, focus
 * and form semantics); use this when you lay the radios out yourself. For a
 * managed group with roving tabindex use `RadioGroup`.
 *
 * The label is the default slot, falling back to the `label` prop. Colors are
 * themeable via `--ds-radio-*`.
 */
export const Radio = defineComponent({
  name: "Radio",
  props: {
    value: { type: String, required: true },
    name: { type: String, required: true },
    checked: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    label: { type: String, default: undefined },
    onChange: { type: Function as PropType<(value: string) => void>, default: undefined },
  },
  setup(props, { slots }) {
    const id = `ds-radio-${++instanceCount}`;

    return () =>
      h("label", { class: ["radio", { "radio--disabled": props.disabled }], for: id }, [
        h("input", {
          id,
          class: "radio__input",
          type: "radio",
          name: props.name,
          value: props.value,
          checked: props.checked,
          disabled: props.disabled,
          onChange: () => props.onChange?.(props.value),
        }),
        h("span", { class: "radio__dot", "aria-hidden": "true" }),
        h("span", { class: "radio__label" }, slots.default ? slots.default() : props.label),
      ]);
  },
});
