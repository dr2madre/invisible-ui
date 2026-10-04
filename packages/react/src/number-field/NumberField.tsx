import { numberField as core } from "@design-system/core";
import { useId, useRef } from "react";
import { useI18n } from "../i18n/i18n";
import { cx } from "../internal/cx";
import { useNumberField } from "./use-number-field";

export interface NumberFieldProps {
  /** Visible label, tied to the control. */
  label: string;
  /** Initial (uncontrolled) or current (controlled) value; `null` means empty. */
  value?: number | null;
  /** BCP-47 locale for parsing and display. Defaults to the provider's locale. */
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
  /** Optional hint shown under the control and linked via `aria-describedby`. */
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

/** The catalog message for each way a typed number can be wrong. */
const MESSAGES = {
  parse: "numberField.parseError",
  "range-underflow": "numberField.rangeUnderflow",
  "range-overflow": "numberField.rangeOverflow",
  "step-mismatch": "numberField.stepMismatch",
} as const;

/**
 * NumberField — the styled, locale-aware decimal field. Behaviour and
 * accessibility (spinbutton semantics on a text input, locale parsing,
 * draft/value separation, stepping, commit boundaries) come from the headless
 * number field; this layer adds the label, the spin buttons, the optional
 * description and error message, the hidden form input and the field styling.
 * Themeable via `--ds-field-*`.
 */
export function NumberField({
  label,
  value = null,
  locale,
  min,
  max,
  step = 1,
  disabled = false,
  readOnly = false,
  required = false,
  changeOnWheel = false,
  description,
  error,
  name,
  form,
  onValueChange,
  onValueCommit,
}: NumberFieldProps) {
  const i18n = useI18n();
  const { t } = i18n;
  const resolvedLocale = locale ?? i18n.locale;
  const id = `ds-number-field-${useId()}`;
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;
  const ref = useRef<HTMLInputElement>(null);

  const api = useNumberField({
    id,
    value,
    locale: resolvedLocale,
    min,
    max,
    step,
    disabled,
    readOnly,
    required,
    changeOnWheel,
    invalid: Boolean(error),
    describedBy:
      [description ? descriptionId : null, error ? errorId : null].filter(Boolean).join(" ") ||
      undefined,
    messages: {
      increment: t("numberField.increment", { label }),
      decrement: t("numberField.decrement", { label }),
    },
    onValueChange,
    onValueCommit,
    controlRef: ref,
  });

  const format = (number: number) => core.formatNumber(number, resolvedLocale);
  const message =
    error ??
    (api.validationError
      ? t(MESSAGES[api.validationError], {
          min: format(min ?? 0),
          max: format(max ?? 0),
          step: format(step),
        })
      : undefined);

  return (
    <div
      className={cx(
        "number-field",
        Boolean(message) && "number-field--invalid",
        disabled && "number-field--disabled",
      )}
    >
      <label className="field__label" {...api.labelProps}>
        {label}
        {required ? (
          <span className="field__required" aria-hidden="true">
            {" *"}
          </span>
        ) : null}
      </label>
      <div className="number-field__group">
        <button
          className="number-field__spin number-field__spin--decrement"
          {...api.decrementProps}
        >
          <span aria-hidden="true">−</span>
        </button>
        {/* The reset anchors on this input, so it names the owning form when
            the field renders outside it. */}
        <input
          {...api.inputProps}
          ref={ref}
          form={form}
          className="field__control number-field__input"
        />
        <button
          className="number-field__spin number-field__spin--increment"
          {...api.incrementProps}
        >
          <span aria-hidden="true">+</span>
        </button>
        {name ? (
          <input
            type="hidden"
            name={name}
            form={form}
            value={api.formValue}
            disabled={disabled || undefined}
          />
        ) : null}
      </div>
      {description ? (
        <p className="field__description" id={descriptionId}>
          {description}
        </p>
      ) : null}
      <p
        id={errorId}
        className="field__error"
        aria-live="polite"
        role={error ? "alert" : undefined}
        hidden={!message}
      >
        {message ?? ""}
      </p>
    </div>
  );
}
