import { useRef, type InputHTMLAttributes } from "react";
import { Icon } from "../icon/Icon";
import { useI18n } from "../i18n/i18n";
import { useTextField } from "../text-field/use-text-field";

export interface SearchFieldProps {
  /** Visible label and accessible name of the search input. */
  label: string;
  /** Visually hide the label while preserving the accessible name. */
  hideLabel?: boolean;
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
  autoComplete?: InputHTMLAttributes<HTMLInputElement>["autoComplete"];
  /** Accessible name for the conditional clear button. */
  clearLabel?: string;
  /** Accessible name for the native submit button. */
  submitLabel?: string;
  /** Called once after a user edit or clear action is committed locally. */
  onValueChange?: (value: string) => void;
}

/** A search input with clear and submit buttons in one visual control. */
export function SearchField({
  label,
  hideLabel = false,
  value = "",
  placeholder,
  disabled = false,
  required = false,
  readOnly = false,
  name,
  autoComplete,
  clearLabel,
  submitLabel,
  onValueChange,
}: SearchFieldProps) {
  const { t } = useI18n();
  const controlRef = useRef<HTMLInputElement>(null);
  const api = useTextField({
    value,
    disabled,
    required,
    readOnly,
    onValueChange,
    controlRef,
  });

  const clear = () => {
    if (disabled || readOnly || api.value === "") return;
    api.setValue("");
    controlRef.current?.focus();
  };

  return (
    <div className={disabled ? "search-field search-field--disabled" : "search-field"}>
      <label
        {...api.labelProps}
        className={
          hideLabel ? "search-field__label search-field__label--hidden" : "search-field__label"
        }
      >
        {label}
        {required && (
          <span className="search-field__required" aria-hidden="true">
            {" *"}
          </span>
        )}
      </label>
      <div className="search-field__control">
        <input
          {...api.controlProps}
          ref={controlRef}
          className="search-field__input"
          type="search"
          name={name}
          placeholder={placeholder}
          autoComplete={autoComplete}
          value={api.value}
          onChange={(event) => api.setValue(event.currentTarget.value)}
        />
        {api.value && !disabled && !readOnly ? (
          <button
            className="search-field__action search-field__clear"
            type="button"
            aria-label={clearLabel ?? t("searchField.clear")}
            onClick={clear}
          >
            <Icon>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </Icon>
          </button>
        ) : null}
        <button
          className="search-field__action search-field__submit"
          type="submit"
          aria-label={submitLabel ?? t("searchField.submit")}
          disabled={disabled}
        >
          <Icon>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </Icon>
        </button>
      </div>
    </div>
  );
}
