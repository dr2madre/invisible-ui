import { defineComponent, h, ref, watch, type PropType } from "vue";
import { HazardGlyph, Icon } from "../icon/Icon";
import { useTextField } from "../text-field/use-text-field";
import { useFormReset, useLiveDom } from "../internal/form-reset";

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
  /** Success/validated message; shows a confirming caption. */
  success?: string;
  disabled?: boolean;
  required?: boolean;
  readOnly?: boolean;
  /** Form field name; the value is submitted under it. */
  name?: string;
  /** Native textarea autocomplete hint. */
  autocomplete?: string;
  /** Native length limits; the browser enforces them and reports them. */
  maxlength?: number;
  minlength?: number;
  /** Turn spelling correction off for codes and identifiers. */
  spellcheck?: boolean;
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
    success: { type: String, default: undefined },
    disabled: { type: Boolean, default: false },
    required: { type: Boolean, default: false },
    readOnly: { type: Boolean, default: false },
    name: { type: String, default: undefined },
    autocomplete: { type: String, default: undefined },
    maxlength: { type: Number, default: undefined },
    minlength: { type: Number, default: undefined },
    spellcheck: { type: Boolean, default: undefined },
    onValueChange: { type: Function as PropType<(value: string) => void>, default: undefined },
  },
  emits: {
    "update:modelValue": (value: string) => typeof value === "string",
  },
  setup(props, { emit }) {
    const control = ref<HTMLTextAreaElement | null>(null);
    const given = () => props.modelValue ?? props.value ?? "";
    // What the composable is told: a reset writes the default here, which is
    // its silent path (the watch, not the setter).
    const told = ref(given());
    // The reset default follows the prop, except a give-back of what the
    // control itself reported (ADR 0012).
    const fallback = ref(given());
    watch(given, (next) => {
      if (next !== told.value) fallback.value = next;
      told.value = next;
    });

    const api = useTextField(() => ({
      value: told.value,
      disabled: props.disabled,
      required: props.required,
      readOnly: props.readOnly,
      invalid: Boolean(props.error),
      hasDescription: Boolean(props.description),
      hasSuccess: Boolean(props.success),
      onValueChange: (next: string) => {
        told.value = next;
        emit("update:modelValue", next);
        props.onValueChange?.(next);
      },
    }));

    // The attribute carries the default, so a native reset and a no-script
    // render both have one; the property carries what the user sees.
    useLiveDom(control, () => ({ value: api.value.value }));
    useFormReset(
      () => control.value,
      () => {
        told.value = fallback.value;
      },
    );

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
              "textarea--success": Boolean(props.success) && !props.error,
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
          // A textarea's default is its child text, not a value attribute:
          // the default goes in the content, the state in the property.
          h(
            "textarea",
            {
              ...api.value.controlProps,
              class: "field__control",
              name: props.name,
              autocomplete: props.autocomplete,
              maxlength: props.maxlength,
              minlength: props.minlength,
              spellcheck: props.spellcheck,
              placeholder: props.placeholder,
              rows: props.rows,
              ref: control,
              onInput,
            },
            fallback.value,
          ),
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
  },
});
