import { defineComponent, h, nextTick, ref, type PropType } from "vue";
import { useI18n } from "../i18n/i18n";
import { Icon } from "../icon/Icon";
import { Tag } from "../tag/Tag";
import { useMultiSelect, type MultiSelectItem } from "./use-multi-select";

export interface MultiSelectProps {
  /** Accessible, visible label (required). */
  label: string;
  /** Ordered list of all options. */
  items: MultiSelectItem[];
  /** The selected values (controlled). Replace the array; do not mutate it. */
  values?: string[];
  /** Called with the next values after a user action. */
  onValuesChange?: (values: string[]) => void;
  onInputValueChange?: (text: string) => void;
  onOpenChange?: (open: boolean) => void;
  /** Input placeholder. Defaults to the catalog's "Search…". */
  placeholder?: string;
  disabled?: boolean;
  /** Review-only: focus works, opening/adding/removing do not. */
  readOnly?: boolean;
  /** Cap on additions; never removes existing values. */
  max?: number;
  /** Opt in to Backspace removal from an empty input. */
  removeOnBackspace?: boolean;
  /** Form field name; one hidden input per value is submitted under it. */
  name?: string;
  /**
   * Expose `aria-required` on the input. Native constraint validation cannot
   * cover hidden multi-value inputs; validation stays with the application.
   */
  required?: boolean;
  /** Empty-result row text. Defaults to the catalog's "No results". */
  emptyText?: string;
}

/**
 * MultiSelect: the styled multi-value picker, ported from the Svelte adapter.
 * An editable, labelled input filters a multiselectable listbox; the chosen
 * values render as removable tags in a labelled list. Behaviour, semantics and
 * state live in `@design-system/core` (a sibling of Combobox; the two public
 * contracts stay separate).
 *
 * DOM focus stays on the input (`aria-activedescendant`); Enter adds the
 * active option and keeps the popup open; every tag has a remove button named
 * "Remove <label>" on an ordinary Tab stop, and removing one moves focus to
 * the next remove button, else the previous one, else the input. With `name`,
 * one hidden input per value is submitted in selection order
 * (`FormData.getAll`); `required` only exposes `aria-required`. Themeable via
 * `--ds-multi-select-*`.
 */
export const MultiSelect = defineComponent({
  name: "MultiSelect",
  props: {
    label: { type: String, required: true },
    items: { type: Array as PropType<MultiSelectItem[]>, required: true },
    values: { type: Array as PropType<string[]>, default: () => [] },
    onValuesChange: {
      type: Function as PropType<(values: string[]) => void>,
      default: undefined,
    },
    onInputValueChange: {
      type: Function as PropType<(text: string) => void>,
      default: undefined,
    },
    onOpenChange: { type: Function as PropType<(open: boolean) => void>, default: undefined },
    placeholder: { type: String, default: undefined },
    disabled: { type: Boolean, default: false },
    readOnly: { type: Boolean, default: false },
    max: { type: Number, default: undefined },
    removeOnBackspace: { type: Boolean, default: false },
    name: { type: String, default: undefined },
    required: { type: Boolean, default: false },
    emptyText: { type: String, default: undefined },
  },
  setup(props) {
    const i18n = useI18n();

    const multiSelect = useMultiSelect(() => ({
      items: props.items,
      values: props.values,
      disabled: props.disabled,
      readOnly: props.readOnly,
      max: props.max,
      removeOnBackspace: props.removeOnBackspace,
      onValuesChange: props.onValuesChange,
      onInputValueChange: props.onInputValueChange,
      onOpenChange: props.onOpenChange,
    }));
    const {
      api,
      items: visible,
      inputValue,
      values,
      inputRef,
      listboxRef,
      controlRef,
      floatingStyles,
      onInputChange,
      onInputPointerDown,
    } = multiSelect;

    const listRef = ref<HTMLElement | null>(null);

    // Removing through a remove button unmounts that button, so focus would
    // fall to the body: move it to the remove button now at the same index
    // (the next one), else the previous one, else the input.
    const removeAt = (value: string, index: number) => {
      api.value.remove(value);
      void nextTick().then(() => {
        const buttons = listRef.value
          ? Array.from(listRef.value.querySelectorAll<HTMLElement>(".tag__remove"))
          : [];
        const target = buttons[index] ?? buttons[index - 1] ?? inputRef.value;
        target?.focus();
      });
    };

    return () => {
      const { t } = i18n.value;
      const inert = props.disabled || props.readOnly;
      const selectedItems = api.value.selectedItems;

      return h("div", { class: "multi-select" }, [
        props.name
          ? values.value.map((value) =>
              h("input", { key: value, type: "hidden", name: props.name, value }),
            )
          : null,
        h("label", { class: "multi-select__label", ...api.value.labelProps }, props.label),
        h(
          "div",
          {
            class: [
              "multi-select__control",
              {
                "multi-select__control--disabled": props.disabled,
                "multi-select__control--readonly": props.readOnly,
              },
            ],
            ref: controlRef,
          },
          [
            selectedItems.length > 0
              ? h(
                  "ul",
                  {
                    class: "multi-select__values",
                    ...api.value.valuesListProps,
                    "aria-label": t("multiSelect.selected"),
                    ref: listRef,
                  },
                  selectedItems.map((item, index) =>
                    h("li", { key: item.value, class: "multi-select__value" }, [
                      h(
                        Tag,
                        {
                          removable: !inert && !(item.disabled ?? false),
                          removeLabel: t("multiSelect.remove", {
                            name: item.label ?? item.value,
                          }),
                          onRemove: () => removeAt(item.value, index),
                        },
                        { default: () => item.label ?? item.value },
                      ),
                    ]),
                  ),
                )
              : null,
            h("input", {
              ...api.value.inputProps,
              class: "multi-select__input",
              type: "text",
              placeholder: props.placeholder ?? t("multiSelect.placeholder"),
              disabled: props.disabled,
              readonly: props.readOnly,
              "aria-required": props.required ? "true" : undefined,
              value: inputValue.value,
              ref: inputRef,
              onInput: onInputChange,
              onPointerdown: onInputPointerDown,
            }),
          ],
        ),
        h(
          "ul",
          {
            ...api.value.listboxProps,
            class: "multi-select__listbox",
            style: floatingStyles.value,
            ref: listboxRef,
          },
          visible.value.length > 0
            ? visible.value.map((item) =>
                h(
                  "li",
                  {
                    key: item.value,
                    class: "multi-select__option",
                    ...api.value.getOptionProps(item.value),
                  },
                  [
                    h("span", { class: "multi-select__check", "aria-hidden": "true" }, [
                      h(
                        Icon,
                        { size: "100%", strokeWidth: 2.5 },
                        { default: () => h("polyline", { points: "20 6 9 17 4 12" }) },
                      ),
                    ]),
                    h("span", { class: "multi-select__option-label" }, item.label ?? item.value),
                  ],
                ),
              )
            : [
                h(
                  "li",
                  {
                    class: "multi-select__empty",
                    role: "option",
                    "aria-selected": "false",
                    "aria-disabled": "true",
                  },
                  props.emptyText ?? t("multiSelect.empty"),
                ),
              ],
        ),
      ]);
    };
  },
});
