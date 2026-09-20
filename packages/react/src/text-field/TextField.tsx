import { useRef, type InputHTMLAttributes, type ReactNode } from "react";
import { Icon } from "../icon/Icon";
import { useTextField } from "./use-text-field";

type InputType = "text" | "search" | "email" | "password" | "tel" | "url" | "number";

export interface TextFieldProps {
  /** Visible label and accessible name for the control. */
  label: string;
  /** Visually hide the label while keeping it as the control's accessible name. */
  hideLabel?: boolean;
  /** Initial or current value. */
  value?: string;
  /** Native input type. */
  type?: InputType;
  /** Native placeholder. It does not replace the label. */
  placeholder?: string;
  /** Hint linked to the control through `aria-describedby`. */
  description?: string;
  /** Error message that marks the control invalid and is announced. */
  error?: string;
  /** Confirmation message announced politely when the field is valid. */
  success?: string;
  /** Prevent interaction and form submission. */
  disabled?: boolean;
  /** Mark the native input as required. */
  required?: boolean;
  /** Keep the input focusable and submittable but prevent edits. */
  readOnly?: boolean;
  /** Native form field name. */
  name?: string;
  /** Native maximum length constraint. */
  maxLength?: number;
  /** Native minimum length constraint. */
  minLength?: number;
  /** Native validation pattern. */
  pattern?: string;
  /** Preferred virtual keyboard mode. */
  inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
  /** Native autofill hint. */
  autoComplete?: InputHTMLAttributes<HTMLInputElement>["autoComplete"];
  /** Enable or disable browser spelling correction. */
  spellCheck?: boolean;
  /** Called once after a user edit is committed locally. */
  onValueChange?: (value: string) => void;
  /** Decorative content placed inside the control at the inline start. */
  left?: ReactNode;
  /** Decorative content placed inside the control at the inline end. */
  right?: ReactNode;
}

/** A native single-line input with shared field semantics and styling. */
export function TextField({
  label,
  hideLabel = false,
  value = "",
  type = "text",
  placeholder,
  description,
  error,
  success,
  disabled = false,
  required = false,
  readOnly = false,
  name,
  maxLength,
  minLength,
  pattern,
  inputMode,
  autoComplete,
  spellCheck,
  onValueChange,
  left,
  right,
}: TextFieldProps) {
  const controlRef = useRef<HTMLInputElement>(null);
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
  const showSuccessIcon = Boolean(success) && !error && !right;

  return (
    <div
      className={[
        "text-field",
        error ? "text-field--invalid" : "",
        success && !error ? "text-field--success" : "",
        disabled ? "text-field--disabled" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <label
        {...api.labelProps}
        className={hideLabel ? "field__label field__label--hidden" : "field__label"}
      >
        {label}
        {required && (
          <span className="field__required" aria-hidden="true">
            {" *"}
          </span>
        )}
      </label>

      <div className="field__input">
        {left && (
          <span className="field__icon field__icon--left" aria-hidden="true">
            {left}
          </span>
        )}
        <input
          {...api.controlProps}
          ref={controlRef}
          className={[
            "field__control",
            left ? "field__control--icon-left" : "",
            right || showSuccessIcon ? "field__control--icon-right" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          type={type}
          name={name}
          placeholder={placeholder}
          maxLength={maxLength}
          minLength={minLength}
          pattern={pattern}
          inputMode={inputMode}
          autoComplete={autoComplete}
          spellCheck={spellCheck}
          value={api.value}
          onChange={(event) => api.setValue(event.currentTarget.value)}
        />
        {right ? (
          <span className="field__icon field__icon--right" aria-hidden="true">
            {right}
          </span>
        ) : showSuccessIcon ? (
          <span className="field__icon field__icon--right field__icon--success" aria-hidden="true">
            <Icon>
              <polyline points="20 6 9 17 4 12" />
            </Icon>
          </span>
        ) : null}
      </div>

      {description && (
        <p className="field__description" {...api.descriptionProps}>
          {description}
        </p>
      )}
      {error ? (
        <p className="field__error" {...api.errorProps}>
          <span className="field__msg-icon" aria-hidden="true">
            <Icon size="1em">
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12" y2="17" />
            </Icon>
          </span>
          {error}
        </p>
      ) : success ? (
        <p className="field__success" {...api.successProps}>
          <span className="field__msg-icon" aria-hidden="true">
            <Icon size="1em">
              <polyline points="20 6 9 17 4 12" />
            </Icon>
          </span>
          {success}
        </p>
      ) : null}
    </div>
  );
}
