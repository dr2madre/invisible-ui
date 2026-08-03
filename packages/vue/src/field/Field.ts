import { defineComponent, h, type SlotsType, type VNode } from "vue";
import { useField } from "./use-field";

export interface FieldProps {
  /** The field label. */
  label: string;
  /** Optional helper/description text. */
  description?: string;
  /** Optional error message; when set, the field is marked invalid. */
  error?: string;
  /** Whether the control is required. */
  required?: boolean;
  /** Whether the field is disabled. */
  disabled?: boolean;
  /** Base id; auto-generated when omitted. */
  id?: string;
}

/**
 * Field: a styled form field that wires a label, control, description and
 * error message together. Behaviour and accessibility (id linking,
 * `aria-describedby`, `aria-invalid` / `aria-required`) come from the headless
 * field (`@design-system/core`).
 *
 * The control goes in the default slot, a scoped slot exposing `controlProps`
 * (spread them onto your control) and `controlId`:
 *
 * ```vue
 * <Field label="Email" description="We'll never share it." :error="err"
 *   v-slot="{ controlProps }">
 *   <input type="email" v-bind="controlProps" />
 * </Field>
 * ```
 *
 * Colors and spacing are themeable via `--ds-field-*`.
 */
export const Field = defineComponent({
  name: "Field",
  props: {
    label: { type: String, required: true },
    description: { type: String, default: undefined },
    error: { type: String, default: undefined },
    required: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    id: { type: String, default: undefined },
  },
  slots: Object as SlotsType<{
    default?: (scope: { controlProps: Record<string, unknown>; controlId: string }) => VNode[];
  }>,
  setup(props, { slots }) {
    const api = useField(() => ({
      id: props.id,
      required: props.required,
      disabled: props.disabled,
      invalid: Boolean(props.error),
      hasDescription: Boolean(props.description),
      hasError: Boolean(props.error),
    }));

    return () =>
      h(
        "div",
        {
          class: ["form-field", { "form-field--disabled": props.disabled }],
          ...api.value.rootProps,
        },
        [
          h("label", { class: "field__label", ...api.value.labelProps }, [
            props.label,
            props.required
              ? h("span", { class: "field__required", "aria-hidden": "true" }, "*")
              : null,
          ]),
          slots.default?.({
            controlProps: api.value.controlProps,
            controlId: api.value.ids.control,
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
