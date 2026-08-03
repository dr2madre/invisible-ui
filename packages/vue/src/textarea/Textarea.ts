import { defineComponent, h, type PropType } from "vue";
import { useTextField } from "../text-field/use-text-field";

export interface TextareaProps {
  /** Visible label, tied to the control. */
  label: string;
  /** `v-model` value; takes precedence over `value` when bound. */
  modelValue?: string;
  value?: string;
  placeholder?: string;
  rows?: number;
  /** Optional hint shown under the control and linked via aria-describedby. */
  description?: string;
  /** Error message; when non-empty the field becomes invalid and announces it. */
  error?: string;
  disabled?: boolean;
  required?: boolean;
  readOnly?: boolean;
  /** Called whenever the value changes. */
  onValueChange?: (value: string) => void;
}

/**
 * Textarea: the styled, batteries-included multi-line text field. Shares the
 * headless text-field wiring (`@design-system/core`) with {@link TextField}:
 * label association, `aria-describedby` for the hint and error, and
 * `aria-invalid` / `aria-required`. This layer renders a `<textarea>` plus the
 * label, optional description and error message.
 *
 * Passing a non-empty `error` puts the field in the invalid state and
 * announces the message. The value binds two ways: `v-model` or the `value`
 * prop plus `onValueChange`. Colors and sizing are themeable CSS custom
 * properties (`--ds-field-*`).
 */
export const Textarea = defineComponent({
  name: "Textarea",
  props: {
    label: { type: String, required: true },
    modelValue: { type: String, default: undefined },
    value: { type: String, default: "" },
    placeholder: { type: String, default: undefined },
    rows: { type: Number, default: 3 },
    description: { type: String, default: undefined },
    error: { type: String, default: undefined },
    disabled: { type: Boolean, default: false },
    required: { type: Boolean, default: false },
    readOnly: { type: Boolean, default: false },
    onValueChange: { type: Function as PropType<(value: string) => void>, default: undefined },
  },
  emits: {
    "update:modelValue": (value: string) => typeof value === "string",
  },
  setup(props, { emit }) {
    const api = useTextField(() => ({
      value: props.modelValue ?? props.value,
      disabled: props.disabled,
      required: props.required,
      readOnly: props.readOnly,
      invalid: Boolean(props.error),
      hasDescription: Boolean(props.description),
      onValueChange: (next: string) => {
        emit("update:modelValue", next);
        props.onValueChange?.(next);
      },
    }));

    const onInput = (event: Event) => {
      api.value.setValue((event.currentTarget as HTMLTextAreaElement).value);
    };

    return () =>
      h(
        "div",
        {
          class: [
            "textarea",
            {
              "textarea--invalid": Boolean(props.error),
              "textarea--disabled": props.disabled,
            },
          ],
        },
        [
          h("label", { class: "field__label", ...api.value.labelProps }, [
            props.label,
            props.required
              ? h("span", { class: "field__required", "aria-hidden": "true" }, " *")
              : null,
          ]),
          h("textarea", {
            ...api.value.controlProps,
            class: "field__control",
            placeholder: props.placeholder,
            rows: props.rows,
            value: api.value.value,
            onInput,
          }),
          props.description
            ? h(
                "p",
                { class: "field__description", ...api.value.descriptionProps },
                props.description,
              )
            : null,
          props.error
            ? h("p", { class: "field__error", ...api.value.errorProps }, props.error)
            : null,
        ],
      );
  },
});
