import { useRef, type TextareaHTMLAttributes } from "react";
import { CheckGlyph, HazardGlyph, Icon } from "../icon/Icon";
import { cx } from "../internal/cx";
import { useTextField } from "./use-text-field";

export interface TextareaProps {
  /** Visible label and accessible name for the control. */
  label: string;
  /** Visually hide the label while keeping it as the control's accessible name. */
  hideLabel?: boolean;
  /** Initial or current value. */
  value?: string;
  /** Native placeholder. It does not replace the label. */
  placeholder?: string;
  /** Visible rows. Defaults to `3`. */
  rows?: number;
  /** Hint linked to the control through `aria-describedby`. */
  description?: string;
  /** Error message that marks the control invalid and is announced. */
  error?: string;
  /** Confirmation message announced politely when the field is valid. */
  success?: string;
  /** Prevent interaction and form submission. */
  disabled?: boolean;
  /** Mark the native textarea as required. */
  required?: boolean;
  /** Keep the textarea focusable and submittable but prevent edits. */
  readOnly?: boolean;
  /** Native form field name: the value is submitted under it. */
  name?: string;
  /** Native autofill hint. */
  autoComplete?: TextareaHTMLAttributes<HTMLTextAreaElement>["autoComplete"];
  /** Native maximum length constraint. */
  maxLength?: number;
  /** Native minimum length constraint. */
  minLength?: number;
  /** Turn spelling correction off for codes and identifiers. */
  spellCheck?: boolean;
  /** Called once after a user edit is committed locally. */
  onValueChange?: (value: string) => void;
}

/**
 * Textarea: the styled multi-line text field. It shares the headless
 * text-field wiring with `TextField`: label association, `aria-describedby`
 * for the hint and the messages, `aria-invalid` and `aria-required`. A form
 * reset restores the current default without reporting it (ADR 0012).
 * Themeable via `--ds-field-*`.
 */
export function Textarea({
  label,
  hideLabel = false,
  value = "",
  placeholder,
  rows = 3,
  description,
  error,
  success,
  disabled = false,
  required = false,
  readOnly = false,
  name,
  autoComplete,
  maxLength,
  minLength,
  spellCheck,
  onValueChange,
}: TextareaProps) {
  const controlRef = useRef<HTMLTextAreaElement>(null);
  const api = useTextField({
    value,
    disabled,
    required,
    readOnly,
    invalid: Boolean(error),
    hasDescription: Boolean(description),
    hasSuccess: Boolean(success),
    onValueChange,
    controlRef,
  });

  return (
    <div
      className={cx(
        "textarea",
        error && "textarea--invalid",
        success && !error && "textarea--success",
        disabled && "textarea--disabled",
      )}
    >
      <label
        {...api.labelProps}
        className={hideLabel ? "field__label field__label--hidden" : "field__label"}
      >
        {label}
        {required ? (
          <span className="field__required" aria-hidden="true">
            {" *"}
          </span>
        ) : null}
      </label>

      <textarea
        {...api.controlProps}
        ref={controlRef}
        className="field__control"
        name={name}
        autoComplete={autoComplete}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        minLength={minLength}
        spellCheck={spellCheck}
        value={api.value}
        onChange={(event) => api.setValue(event.currentTarget.value)}
      />

      {description ? (
        <p className="field__description" {...api.descriptionProps}>
          {description}
        </p>
      ) : null}
      {error ? (
        <p className="field__error" {...api.errorProps}>
          <span className="field__msg-icon" aria-hidden="true">
            <Icon size="1em">
              <HazardGlyph />
            </Icon>
          </span>
          {error}
        </p>
      ) : success ? (
        <p className="field__success" {...api.successProps}>
          <span className="field__msg-icon" aria-hidden="true">
            <Icon size="1em">
              <CheckGlyph />
            </Icon>
          </span>
          {success}
        </p>
      ) : null}
    </div>
  );
}
