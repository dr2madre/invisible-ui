import { numberField as core } from "@design-system/core";
import { defineComponent, h, onMounted, onUnmounted, ref, type PropType } from "vue";
import { useI18n } from "../i18n/i18n";
import { useStableId } from "../internal/use-stable-id";
import { useNumberField, type NumberFieldError } from "./use-number-field";

export interface NumberFieldProps {
  /** Visible label, tied to the control. */
  label: string;
  /** `v-model` value; takes precedence over `value` when bound. */
  modelValue?: number | null;
  /** The canonical value; `null` means empty. */
  value?: number | null;
  /** BCP-47 locale for parsing and display. Defaults to the i18n scope. */
  locale?: string;
  min?: number;
  max?: number;
  /** Step for the spin actions; typed values are validated against it. */
  step?: number;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  /** Opt in to wheel stepping while the input is focused and hovered. */
  changeOnWheel?: boolean;
  /** Optional hint shown under the control and linked via aria-describedby. */
  description?: string;
  /** Error message; when non-empty the field becomes invalid and announces it. */
  error?: string;
  /** Form field name; the canonical ASCII value is submitted under it. */
  name?: string;
  /** Id of the owning form when the field renders outside of it. */
  form?: string;
  /** Called when the canonical value changes while editing. */
  onValueChange?: (value: number | null) => void;
  /** Called at commit boundaries: blur, Enter, and spin actions. */
  onValueCommit?: (value: number | null) => void;
}

/**
 * NumberField: the styled, locale-aware decimal field. Behaviour and
 * accessibility (spinbutton semantics on a text input, locale parsing,
 * draft/value separation, stepping, commit boundaries) come from the headless
 * number field (`@design-system/core`); this layer adds the label, spin
 * buttons, optional description and error message, the hidden form input, and
 * the field styling. The value binds two ways: `v-model` or the `value` prop
 * plus `onValueChange`, matching the Svelte adapter. Themeable via
 * `--ds-field-*`.
 */
export const NumberField = defineComponent({
  name: "NumberField",
  props: {
    label: { type: String, required: true },
    modelValue: { type: Number as PropType<number | null>, default: undefined },
    value: { type: Number as PropType<number | null>, default: null },
    locale: { type: String, default: undefined },
    min: { type: Number, default: undefined },
    max: { type: Number, default: undefined },
    step: { type: Number, default: 1 },
    disabled: { type: Boolean, default: false },
    readOnly: { type: Boolean, default: false },
    required: { type: Boolean, default: false },
    changeOnWheel: { type: Boolean, default: false },
    description: { type: String, default: undefined },
    error: { type: String, default: undefined },
    name: { type: String, default: undefined },
    form: { type: String, default: undefined },
    onValueChange: {
      type: Function as PropType<(value: number | null) => void>,
      default: undefined,
    },
    onValueCommit: {
      type: Function as PropType<(value: number | null) => void>,
      default: undefined,
    },
  },
  emits: {
    "update:modelValue": (value: number | null) => value === null || typeof value === "number",
  },
  setup(props, { emit }) {
    const i18n = useI18n();
    const fieldId = useStableId("ds-number-field");

    const { api, inputValue, reset, id } = useNumberField(() => ({
      id: fieldId,
      value: props.modelValue !== undefined ? props.modelValue : props.value,
      locale: props.locale ?? i18n.value.locale,
      min: props.min,
      max: props.max,
      step: props.step,
      disabled: props.disabled,
      readOnly: props.readOnly,
      required: props.required,
      changeOnWheel: props.changeOnWheel,
      invalid: Boolean(props.error),
      describedBy:
        [
          props.description ? `${fieldId}-description` : null,
          props.error ? `${fieldId}-error` : null,
        ]
          .filter(Boolean)
          .join(" ") || undefined,
      messages: {
        increment: i18n.value.t("numberField.increment", { label: props.label }),
        decrement: i18n.value.t("numberField.decrement", { label: props.label }),
      },
      onValueChange: (next: number | null) => {
        emit("update:modelValue", next);
        props.onValueChange?.(next);
      },
      onValueCommit: props.onValueCommit,
    }));

    const initialValue = props.modelValue !== undefined ? props.modelValue : (props.value ?? null);
    const inputEl = ref<HTMLInputElement | null>(null);
    let owner: HTMLFormElement | null = null;
    // Form reset restores the mount value and display without callbacks.
    const onReset = () => reset(initialValue);
    onMounted(() => {
      owner =
        inputEl.value?.form ??
        (props.form ? (document.getElementById(props.form) as HTMLFormElement | null) : null);
      owner?.addEventListener("reset", onReset);
    });
    onUnmounted(() => owner?.removeEventListener("reset", onReset));

    const onInput = (event: Event) => {
      api.value.setDraft((event.currentTarget as HTMLInputElement).value);
    };

    const resolvedLocale = () => props.locale ?? i18n.value.locale;
    const validationMessage = (error: NumberFieldError | null): string | undefined => {
      switch (error) {
        case "parse":
          return i18n.value.t("numberField.parseError");
        case "range-underflow":
          return i18n.value.t("numberField.rangeUnderflow", {
            min: core.formatNumber(props.min ?? 0, resolvedLocale()),
          });
        case "range-overflow":
          return i18n.value.t("numberField.rangeOverflow", {
            max: core.formatNumber(props.max ?? 0, resolvedLocale()),
          });
        case "step-mismatch":
          return i18n.value.t("numberField.stepMismatch", {
            step: core.formatNumber(props.step, resolvedLocale()),
          });
        default:
          return undefined;
      }
    };

    return () => {
      const message = props.error ?? validationMessage(api.value.validationError);
      return h(
        "div",
        {
          class: [
            "number-field",
            {
              "number-field--invalid": Boolean(message),
              "number-field--disabled": props.disabled,
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
          h("div", { class: "number-field__group" }, [
            h(
              "button",
              {
                class: "number-field__spin number-field__spin--decrement",
                ...api.value.decrementProps,
              },
              [h("span", { "aria-hidden": "true" }, "−")],
            ),
            h("input", {
              ...api.value.inputProps,
              class: "field__control number-field__input",
              ref: inputEl,
              value: inputValue.value,
              onInput,
            }),
            h(
              "button",
              {
                class: "number-field__spin number-field__spin--increment",
                ...api.value.incrementProps,
              },
              [h("span", { "aria-hidden": "true" }, "+")],
            ),
            props.name
              ? h("input", {
                  type: "hidden",
                  name: props.name,
                  form: props.form,
                  value: api.value.formValue,
                  disabled: props.disabled || undefined,
                })
              : null,
          ]),
          props.description
            ? h("p", { class: "field__description", id: `${id}-description` }, props.description)
            : null,
          h(
            "p",
            {
              id: `${id}-error`,
              class: "field__error",
              "aria-live": "polite",
              role: props.error ? "alert" : undefined,
              hidden: !message,
            },
            message ?? "",
          ),
        ],
      );
    };
  },
});
