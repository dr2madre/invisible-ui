import { defineComponent, h, ref, watch, type PropType } from "vue";
import { Icon } from "../icon/Icon";
import { useI18n } from "../i18n/i18n";
import { useFormReset, useLiveDom } from "../internal/form-reset";
import { useTextField } from "../text-field/use-text-field";

export interface SearchFieldProps {
  /** Visible label and accessible name of the search input. */
  label: string;
  /** Visually hide the label while preserving the accessible name. */
  hideLabel?: boolean;
  /** Controlled query for `v-model`. */
  modelValue?: string;
  /** Initial or controlled search query. */
  value?: string;
  /** Native input placeholder. It does not replace the label. */
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  readOnly?: boolean;
  /** Native form field name. */
  name?: string;
  /** Native browser autofill hint. */
  autocomplete?: string;
  /** Accessible name for the conditional clear button. */
  clearLabel?: string;
  /** Accessible name for the native submit button. */
  submitLabel?: string;
  /** Render the submit button; turn it off for a filter that applies as you type. */
  submitButton?: boolean;
  /** Called once after a user edit or clear action is committed locally. */
  onValueChange?: (value: string) => void;
}

/** A search input with clear and submit buttons in one visual control. */
export const SearchField = defineComponent({
  name: "SearchField",
  props: {
    label: { type: String, required: true },
    hideLabel: { type: Boolean, default: false },
    modelValue: { type: String, default: undefined },
    value: { type: String, default: "" },
    placeholder: { type: String, default: undefined },
    disabled: { type: Boolean, default: false },
    required: { type: Boolean, default: false },
    readOnly: { type: Boolean, default: false },
    name: { type: String, default: undefined },
    autocomplete: { type: String, default: undefined },
    clearLabel: { type: String, default: undefined },
    submitLabel: { type: String, default: undefined },
    submitButton: { type: Boolean, default: true },
    onValueChange: { type: Function as PropType<(value: string) => void>, default: undefined },
  },
  emits: {
    "update:modelValue": (value: string) => typeof value === "string",
  },
  setup(props, { emit }) {
    const i18n = useI18n();
    const control = ref<HTMLInputElement | null>(null);
    const given = () => props.modelValue ?? props.value ?? "";
    const told = ref(given());
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
      onValueChange: (next: string) => {
        told.value = next;
        emit("update:modelValue", next);
        props.onValueChange?.(next);
      },
    }));

    useLiveDom(control, () => ({ value: api.value.value }));
    useFormReset(
      () => control.value,
      () => {
        told.value = fallback.value;
        emit("update:modelValue", fallback.value);
      },
    );

    const onInput = (event: Event) => {
      api.value.setValue((event.currentTarget as HTMLInputElement).value);
    };
    const clear = () => {
      if (props.disabled || props.readOnly || api.value.value === "") return;
      api.value.setValue("");
      control.value?.focus();
    };

    return () => {
      const { t } = i18n.value;
      const current = api.value.value;
      return h(
        "div",
        {
          class: [
            "search-field",
            {
              "search-field--disabled": props.disabled,
              "search-field--no-submit": !props.submitButton,
            },
          ],
        },
        [
          h(
            "label",
            {
              ...api.value.labelProps,
              class: ["search-field__label", { "search-field__label--hidden": props.hideLabel }],
            },
            [
              props.label,
              props.required
                ? h("span", { class: "search-field__required", "aria-hidden": "true" }, " *")
                : null,
            ],
          ),
          h("div", { class: "search-field__control" }, [
            props.submitButton
              ? null
              : h("span", { class: "search-field__icon", "aria-hidden": "true" }, [
                  h(Icon, null, {
                    default: () => [
                      h("circle", { cx: "11", cy: "11", r: "8" }),
                      h("line", { x1: "21", y1: "21", x2: "16.65", y2: "16.65" }),
                    ],
                  }),
                ]),
            h("input", {
              ...api.value.controlProps,
              ref: control,
              class: "search-field__input",
              type: "search",
              name: props.name,
              placeholder: props.placeholder,
              autocomplete: props.autocomplete,
              "^value": fallback.value,
              onInput,
            }),
            current && !props.disabled && !props.readOnly
              ? h(
                  "button",
                  {
                    class: "search-field__action search-field__clear",
                    type: "button",
                    "aria-label": props.clearLabel ?? t("searchField.clear"),
                    onClick: clear,
                  },
                  [
                    h(Icon, null, {
                      default: () => [
                        h("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
                        h("line", { x1: "6", y1: "6", x2: "18", y2: "18" }),
                      ],
                    }),
                  ],
                )
              : null,
            props.submitButton
              ? h(
                  "button",
                  {
                    class: "search-field__action search-field__submit",
                    type: "submit",
                    disabled: props.disabled,
                    "aria-label": props.submitLabel ?? t("searchField.submit"),
                  },
                  [
                    h(Icon, null, {
                      default: () => [
                        h("circle", { cx: "11", cy: "11", r: "8" }),
                        h("line", { x1: "21", y1: "21", x2: "16.65", y2: "16.65" }),
                      ],
                    }),
                  ],
                )
              : null,
          ]),
        ],
      );
    };
  },
});
