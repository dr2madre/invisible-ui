import type { ElementProps } from "@design-system/core";
import type { ReactNode } from "react";
import { useField } from "./use-field";

/** What `Field` hands its control. */
export interface FieldControl {
  /** Spread onto the control: its id and ARIA wiring. */
  controlProps: ElementProps;
  /** The control's id. */
  controlId: string;
}

export interface FieldProps {
  /** The field label. */
  label: string;
  /** Optional helper text. */
  description?: string;
  /** Optional error message; when set, the control is marked invalid. */
  error?: string;
  required?: boolean;
  disabled?: boolean;
  /** Base id. Generated when omitted. */
  id?: string;
  /** Renders the control from the props to spread onto it and its id. */
  children?: (control: FieldControl) => ReactNode;
}

/**
 * Field: a form field that ties a label, a control, a description and an
 * error message together. The ids, `aria-describedby`, `aria-invalid` and
 * `aria-required` come from the headless field (`@design-system/core`).
 *
 * The control comes from `children`, a function given `controlProps` to
 * spread onto it and its `controlId`:
 *
 * ```tsx
 * <Field label="Email" description="We never share it." error={error}>
 *   {({ controlProps }) => <input type="email" {...controlProps} />}
 * </Field>
 * ```
 *
 * Themeable via `--ds-field-*`.
 */
export function Field({
  label,
  description,
  error,
  required = false,
  disabled = false,
  id,
  children,
}: FieldProps) {
  const api = useField({
    id,
    required,
    disabled,
    invalid: Boolean(error),
    hasDescription: Boolean(description),
    hasError: Boolean(error),
  });
  return (
    <div {...api.rootProps} className={disabled ? "form-field form-field--disabled" : "form-field"}>
      <label {...api.labelProps} className="field__label">
        {label}
        {required ? (
          <span className="field__required" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      {children?.({ controlProps: api.controlProps, controlId: api.ids.control })}
      {description ? (
        <p {...api.descriptionProps} className="field__description">
          {description}
        </p>
      ) : null}
      {error ? (
        <p {...api.errorProps} className="field__error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
