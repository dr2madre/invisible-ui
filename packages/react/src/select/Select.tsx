import { useId, type ChangeEvent } from "react";
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
  /** Visually hide the label (kept for assistive tech) — for compact toolbars. */
  hideLabel?: boolean;
  /** Options. Plain text only — see the note on rich options below. */
  items: SelectItem[];
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
  /** Form field name — this is a real `<select>`, so it submits natively. */
  name?: string;
  /** Marks the control as required (native validation + announced to AT). */
  required?: boolean;
  /** Error message; when non-empty the select becomes invalid and announces it. */
  error?: string;
  /** Called whenever the selected value changes. */
  onValueChange?: (value: string) => void;
}

/**
 * Select — a styled **native** `<select>`. The browser owns the popup,
 * keyboard, typeahead, form participation and the platform picker on mobile;
 * this layer styles the closed control (`appearance: none` + a custom chevron)
 * and adds the label, placeholder, width modes and invalid state.
 *
 * By design the options are plain text: the native popup cannot render markup.
 * Rich options, per-option icons or a styled popup belong to a Combobox — see
 * `docs/adr/0003-native-select-advanced-combobox.md`. That ADR is also why this
 * component does not consume the headless `core/select` primitive: the browser
 * supplies the behaviour the primitive would otherwise provide. The primitive
 * remains available for consumers building a fully custom select.
 *
 * Themeable via `--ds-select-*`.
 */
export function Select({
  label,
  hideLabel = false,
  items,
  value = null,
  placeholder,
  disabled = false,
  width = "wrap",
  name,
  required = false,
  error,
  onValueChange,
}: SelectProps) {
  const uid = useId();
  const selectId = `ds-select-${uid}`;
  const errorId = `ds-select-${uid}-error`;
  const { t } = useI18n();

  const resolvedPlaceholder = placeholder ?? t("select.placeholder");
  // The native element always has a selection; `""` stands for "nothing yet"
  // (the hidden, disabled placeholder option) and maps to `value = null`.
  const nativeValue = value ?? "";

  const onChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const next = event.currentTarget.value;
    if (next !== "") onValueChange?.(next);
  };

  return (
    <div className="select" data-width={width}>
      <label
        className={hideLabel ? "select__label select__label--hidden" : "select__label"}
        htmlFor={selectId}
      >
        {label}
      </label>

      <span className="select__control">
        <select
          className={value == null ? "select__native select__native--placeholder" : "select__native"}
          id={selectId}
          name={name}
          disabled={disabled}
          required={required}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? errorId : undefined}
          data-invalid={error ? "" : undefined}
          value={nativeValue}
          onChange={onChange}
        >
          {/* Placeholder: a hidden, disabled option holding the empty value. */}
          <option value="" disabled hidden>
            {resolvedPlaceholder}
          </option>
          {items.map((item) => (
            <option key={item.value} value={item.value} disabled={item.disabled}>
              {item.label ?? item.value}
            </option>
          ))}
        </select>
        <span className="select__chevron" aria-hidden="true">
          <Icon size="100%">
            <polyline points="6 9 12 15 18 9" />
          </Icon>
        </span>
      </span>

      {error && (
        <span className="select__error" id={errorId}>
          {error}
        </span>
      )}
    </div>
  );
}
