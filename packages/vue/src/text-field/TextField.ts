import { defineComponent, h, type PropType } from "vue";
import { HazardGlyph, Icon } from "../icon/Icon";
import { useTextField } from "./use-text-field";

type InputType = "text" | "search" | "email" | "password" | "tel" | "url" | "number";

export interface TextFieldProps {
  /** Visible label, tied to the control. */
  label: string;
  /** `v-model` value; takes precedence over `value` when bound. */
  modelValue?: string;
  value?: string;
  type?: InputType;
  placeholder?: string;
  /** Optional hint shown under the control and linked via aria-describedby. */
  description?: string;
  /** Error message; when non-empty the field becomes invalid and announces it. */
  error?: string;
  /** Success/validated message; shows a green check and a confirming caption. */
  success?: string;
  disabled?: boolean;
  required?: boolean;
  readOnly?: boolean;
  /** Form field name; the value is submitted under it. */
  name?: string;
  /** Called whenever the value changes. */
  onValueChange?: (value: string) => void;
}

/**
 * TextField: the styled, batteries-included single-line text field. Behaviour
 * and accessibility (label association, `aria-describedby` for the hint and
 * error, `aria-invalid` / `aria-required`) come from the headless text field
 * (`@design-system/core`); this layer adds the label, control, optional
 * description and error message, and the focus / invalid styling.
 *
 * Covers the common single-line `type`s (text, search, email, password, tel,
 * url, number). Passing a non-empty `error` puts the field in the invalid
 * state and announces the message. The value binds two ways: `v-model` (the
 * idiomatic Vue form) or the `value` prop plus `onValueChange`, matching the
 * Svelte adapter. `left` and `right` slots hold decorative icons overlaying
 * the control. Colors and sizing are themeable CSS custom properties
 * (`--ds-field-*`).
 */
export const TextField = defineComponent({
  name: "TextField",
  props: {
    label: { type: String, required: true },
    modelValue: { type: String, default: undefined },
    value: { type: String, default: "" },
    type: { type: String as PropType<InputType>, default: "text" },
    placeholder: { type: String, default: undefined },
    description: { type: String, default: undefined },
    error: { type: String, default: undefined },
    success: { type: String, default: undefined },
    disabled: { type: Boolean, default: false },
    required: { type: Boolean, default: false },
    readOnly: { type: Boolean, default: false },
    name: { type: String, default: undefined },
    onValueChange: { type: Function as PropType<(value: string) => void>, default: undefined },
  },
  emits: {
    "update:modelValue": (value: string) => typeof value === "string",
  },
  setup(props, { emit, slots }) {
    const api = useTextField(() => ({
      value: props.modelValue ?? props.value,
      disabled: props.disabled,
      required: props.required,
      readOnly: props.readOnly,
      invalid: Boolean(props.error),
      hasDescription: Boolean(props.description),
      hasSuccess: Boolean(props.success),
      onValueChange: (next: string) => {
        emit("update:modelValue", next);
        props.onValueChange?.(next);
      },
    }));

    const onInput = (event: Event) => {
      api.value.setValue((event.currentTarget as HTMLInputElement).value);
    };

    return () => {
      // A built-in green check (right) when validated, unless a custom right
      // slot is used.
      const showSuccessIcon = Boolean(props.success) && !props.error && !slots.right;

      return h(
        "div",
        {
          class: [
            "text-field",
            {
              "text-field--invalid": Boolean(props.error),
              "text-field--success": Boolean(props.success) && !props.error,
              "text-field--disabled": props.disabled,
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
          h("div", { class: "field__input" }, [
            slots.left
              ? h(
                  "span",
                  { class: "field__icon field__icon--left", "aria-hidden": "true" },
                  slots.left(),
                )
              : null,
            h("input", {
              ...api.value.controlProps,
              class: [
                "field__control",
                {
                  "field__control--icon-left": Boolean(slots.left),
                  "field__control--icon-right": Boolean(slots.right) || showSuccessIcon,
                },
              ],
              type: props.type,
              name: props.name,
              placeholder: props.placeholder,
              value: api.value.value,
              onInput,
            }),
            slots.right
              ? h(
                  "span",
                  { class: "field__icon field__icon--right", "aria-hidden": "true" },
                  slots.right(),
                )
              : showSuccessIcon
                ? h(
                    "span",
                    {
                      class: "field__icon field__icon--right field__icon--success",
                      "aria-hidden": "true",
                    },
                    [h(Icon, null, { default: () => h("polyline", { points: "20 6 9 17 4 12" }) })],
                  )
                : null,
          ]),
          props.description
            ? h(
                "p",
                { class: "field__description", ...api.value.descriptionProps },
                props.description,
              )
            : null,
          props.error
            ? h("p", { class: "field__error", ...api.value.errorProps }, [
                h("span", { class: "field__msg-icon", "aria-hidden": "true" }, [
                  h(Icon, { size: "1em" }, { default: HazardGlyph }),
                ]),
                props.error,
              ])
            : props.success
              ? h("p", { class: "field__success", ...api.value.successProps }, [
                  h("span", { class: "field__msg-icon", "aria-hidden": "true" }, [
                    h(
                      Icon,
                      { size: "1em" },
                      { default: () => h("polyline", { points: "20 6 9 17 4 12" }) },
                    ),
                  ]),
                  props.success,
                ])
              : null,
        ],
      );
    };
  },
});
