import { defineComponent, h, type PropType } from "vue";
import { Icon } from "../icon/Icon";
import { useI18n } from "../i18n/i18n";

export interface SelectItem {
  value: string;
  /** Visible label; falls back to `value`. */
  label?: string;
  disabled?: boolean;
}

export interface SelectProps {
  /** Accessible name for the control. */
  label: string;
  /** Visually hide the label (kept for assistive tech), for compact toolbars. */
  hideLabel?: boolean;
  /** Options. Plain text only; see the note on rich options below. */
  items: SelectItem[];
  /** `v-model` value; takes precedence over `value` when bound. */
  modelValue?: string | null;
  /** Selected value. `null` shows the placeholder. */
  value?: string | null;
  /** Shown while nothing is selected. Defaults to the catalog's "Select…". */
  placeholder?: string;
  disabled?: boolean;
  /**
   * Width behaviour: `wrap` fits the longest option (the native default),
   * `fill` takes 100% of the container, `fixed` uses `--ds-select-width`.
   */
  width?: "wrap" | "fill" | "fixed";
  /** Form field name; this is a real `<select>`, so it submits natively. */
  name?: string;
  /** Marks the control as required (native validation + announced to AT). */
  required?: boolean;
  /** Error message; when non-empty the select becomes invalid and announces it. */
  error?: string;
  /** Called whenever the selected value changes. */
  onValueChange?: (value: string) => void;
}

// Stable per-instance ids for the label / error association. The React adapter
// gets these from `useId`; a module counter keeps the Vue peer range at ^3.4
// (Vue's own `useId` landed in 3.5) and is enough for the client-rendered PoC.
let instanceCount = 0;

/**
 * Select: a styled **native** `<select>`. The browser owns the popup,
 * keyboard, typeahead, form participation and the platform picker on mobile;
 * this layer styles the closed control (`appearance: none` + a custom chevron)
 * and adds the label, placeholder, width modes and invalid state.
 *
 * The selected value binds two ways: `v-model` (the idiomatic Vue form) or the
 * `value` prop plus `onValueChange`, matching the React adapter.
 *
 * By design the options are plain text: the native popup cannot render markup.
 * Rich options, per-option icons or a styled popup belong to a Combobox; see
 * `docs/adr/0003-native-select-advanced-combobox.md`. That ADR is also why this
 * component does not consume the headless `core/select` primitive: the browser
 * supplies the behaviour the primitive would otherwise provide. The primitive
 * remains available for consumers building a fully custom select.
 *
 * Themeable via `--ds-select-*`.
 */
export const Select = defineComponent({
  name: "Select",
  props: {
    label: { type: String, required: true },
    hideLabel: { type: Boolean, default: false },
    items: { type: Array as PropType<SelectItem[]>, required: true },
    modelValue: { type: String as PropType<string | null>, default: undefined },
    value: { type: String as PropType<string | null>, default: null },
    placeholder: { type: String, default: undefined },
    disabled: { type: Boolean, default: false },
    width: { type: String as PropType<"wrap" | "fill" | "fixed">, default: "wrap" },
    name: { type: String, default: undefined },
    required: { type: Boolean, default: false },
    error: { type: String, default: undefined },
    onValueChange: { type: Function as PropType<(value: string) => void>, default: undefined },
  },
  emits: {
    "update:modelValue": (value: string) => typeof value === "string",
  },
  setup(props, { emit }) {
    const uid = ++instanceCount;
    const selectId = `ds-select-${uid}`;
    const errorId = `ds-select-${uid}-error`;
    const i18n = useI18n();

    const onChange = (event: Event) => {
      const next = (event.target as HTMLSelectElement).value;
      if (next === "") return;
      emit("update:modelValue", next);
      props.onValueChange?.(next);
    };

    return () => {
      const { t } = i18n.value;
      const resolvedPlaceholder = props.placeholder ?? t("select.placeholder");
      const selected = props.modelValue !== undefined ? props.modelValue : props.value;
      // The native element always has a selection; `""` stands for "nothing
      // yet" (the hidden, disabled placeholder option) and maps to `null`.
      const nativeValue = selected ?? "";

      return h("div", { class: "select", "data-width": props.width }, [
        h(
          "label",
          {
            class: props.hideLabel ? "select__label select__label--hidden" : "select__label",
            for: selectId,
          },
          props.label,
        ),
        h("span", { class: "select__control" }, [
          h(
            "select",
            {
              class:
                selected == null ? "select__native select__native--placeholder" : "select__native",
              id: selectId,
              name: props.name,
              disabled: props.disabled,
              required: props.required,
              "aria-invalid": props.error ? "true" : undefined,
              "aria-describedby": props.error ? errorId : undefined,
              "data-invalid": props.error ? "" : undefined,
              value: nativeValue,
              onChange,
            },
            [
              // Placeholder: a hidden, disabled option holding the empty value.
              h("option", { value: "", disabled: true, hidden: true }, resolvedPlaceholder),
              ...props.items.map((item) =>
                h(
                  "option",
                  { key: item.value, value: item.value, disabled: item.disabled },
                  item.label ?? item.value,
                ),
              ),
            ],
          ),
          h("span", { class: "select__chevron", "aria-hidden": "true" }, [
            h(
              Icon,
              { size: "100%" },
              { default: () => h("polyline", { points: "6 9 12 15 18 9" }) },
            ),
          ]),
        ]),
        props.error ? h("span", { class: "select__error", id: errorId }, props.error) : null,
      ]);
    };
  },
});
