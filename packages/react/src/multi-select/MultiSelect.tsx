import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "../icon/Icon";
import { useI18n } from "../i18n/i18n";
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
 * MultiSelect — the styled multi-value picker, ported from the Svelte and Vue
 * adapters. An editable, labelled input filters a multiselectable listbox; the
 * chosen values render as removable tags in a labelled list. Behaviour,
 * semantics and state live in `@design-system/core` (a sibling of Combobox;
 * the two public contracts stay separate).
 *
 * DOM focus stays on the input (`aria-activedescendant`); Enter adds the
 * active option and keeps the popup open; every tag has a remove button named
 * "Remove <label>" on an ordinary Tab stop, and removing one moves focus to
 * the next remove button, else the previous one, else the input. With `name`,
 * one hidden input per value is submitted in selection order
 * (`FormData.getAll`); `required` only exposes `aria-required`. Themeable via
 * `--ds-multi-select-*`.
 */
export function MultiSelect({
  label,
  items,
  values,
  onValuesChange,
  onInputValueChange,
  onOpenChange,
  placeholder,
  disabled = false,
  readOnly = false,
  max,
  removeOnBackspace = false,
  name,
  required = false,
  emptyText,
}: MultiSelectProps) {
  const { t } = useI18n();
  const multiSelect = useMultiSelect({
    items,
    values,
    disabled,
    readOnly,
    max,
    removeOnBackspace,
    onValuesChange,
    onInputValueChange,
    onOpenChange,
  });
  const {
    api,
    items: visible,
    inputValue,
    values: selectedValues,
    inputRef,
    listboxRef,
    controlRef,
    inputEl,
    floatingStyles,
    onInputChange,
    onInputPointerDown,
  } = multiSelect;

  const listEl = useRef<HTMLUListElement | null>(null);
  const inert = disabled || readOnly;

  // The listbox is portalled to the body, so it must not render before mount.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Removing through a remove button unmounts that button, so focus would
  // fall to the body: move it to the remove button now at the same index
  // (the next one), else the previous one, else the input.
  const removeAt = (value: string, index: number) => {
    api.remove(value);
    requestAnimationFrame(() => {
      const buttons = listEl.current
        ? Array.from(listEl.current.querySelectorAll<HTMLElement>(".tag__remove"))
        : [];
      const target = buttons[index] ?? buttons[index - 1] ?? inputEl.current;
      target?.focus();
    });
  };

  const options =
    visible.length > 0 ? (
      visible.map((item) => (
        <li key={item.value} className="multi-select__option" {...api.getOptionProps(item.value)}>
          <span className="multi-select__check" aria-hidden="true">
            <Icon size="100%" strokeWidth={2.5}>
              <polyline points="20 6 9 17 4 12" />
            </Icon>
          </span>
          <span className="multi-select__option-label">{item.label ?? item.value}</span>
        </li>
      ))
    ) : (
      <li className="multi-select__empty" role="option" aria-selected={false} aria-disabled="true">
        {emptyText ?? t("multiSelect.empty")}
      </li>
    );

  return (
    <div className="multi-select">
      {name
        ? selectedValues.map((value) => (
            <input key={value} type="hidden" name={name} value={value} />
          ))
        : null}
      <label className="multi-select__label" {...api.labelProps}>
        {label}
      </label>

      <div
        className={[
          "multi-select__control",
          disabled ? "multi-select__control--disabled" : "",
          readOnly ? "multi-select__control--readonly" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        ref={controlRef}
      >
        {api.selectedItems.length > 0 ? (
          <ul
            className="multi-select__values"
            {...api.valuesListProps}
            aria-label={t("multiSelect.selected")}
            ref={listEl}
          >
            {api.selectedItems.map((item, index) => {
              const removable = !inert && !(item.disabled ?? false);
              return (
                <li key={item.value} className="multi-select__value">
                  <span className="tag" data-status="neutral" data-variant="soft" data-size="md">
                    <span className="tag__label">{item.label ?? item.value}</span>
                    {removable ? (
                      <button
                        type="button"
                        className="tag__remove"
                        aria-label={t("multiSelect.remove", { name: item.label ?? item.value })}
                        onClick={() => removeAt(item.value, index)}
                      >
                        <svg
                          viewBox="0 0 16 16"
                          width="1em"
                          height="1em"
                          aria-hidden="true"
                          focusable="false"
                        >
                          <path
                            d="M4 4l8 8M12 4l-8 8"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.75"
                            strokeLinecap="round"
                          />
                        </svg>
                      </button>
                    ) : null}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : null}
        <input
          {...api.inputProps}
          className="multi-select__input"
          type="text"
          placeholder={placeholder ?? t("multiSelect.placeholder")}
          disabled={disabled}
          readOnly={readOnly}
          aria-required={required ? "true" : undefined}
          value={inputValue}
          ref={inputRef}
          onChange={onInputChange}
          onPointerDown={onInputPointerDown}
        />
      </div>

      {mounted &&
        createPortal(
          <ul
            {...api.listboxProps}
            className="multi-select__listbox"
            style={floatingStyles}
            ref={listboxRef}
          >
            {options}
          </ul>,
          document.body,
        )}
    </div>
  );
}
