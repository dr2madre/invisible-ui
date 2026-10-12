import { useRef } from "react";
import { useFieldError } from "../internal/field-error";
import { usePinInput, type PinInputType } from "./use-pin-input";

export interface PinInputProps {
  /** Initial (uncontrolled) or current (controlled) code. */
  value?: string;
  length?: number;
  /** Allowed characters. */
  type?: PinInputType;
  /** Render cells masked (like a password). */
  mask?: boolean;
  disabled?: boolean;
  /** Validation state; colors the cells (red ring) and signals errors. */
  invalid?: boolean;
  /**
   * An error message shown under the cells as an alert. It describes each
   * cell and marks the input invalid, like `invalid`. The app owns it: a form
   * reset leaves it in place, so the app clears it.
   */
  error?: string;
  /** Validation success; colors the cells green (e.g. a verified code). */
  success?: boolean;
  /** Form field name; the combined code is submitted under it. */
  name?: string;
  /** Accessible name for the group of cells (required). */
  label: string;
  /** Called whenever the combined value changes. */
  onValueChange?: (value: string) => void;
  /** Called once all cells are filled. */
  onComplete?: (value: string) => void;
}

/**
 * PinInput — a styled OTP / verification-code input: a row of single-character
 * cells. Behaviour and accessibility (per-cell entry, advance/backspace, arrow
 * movement, paste distribution, character filtering) come from the headless
 * PIN input; each cell is named from the catalog ("Character 1 of 6").
 *
 * Provide a `label` for the group's accessible name. Sizing, colors and radius
 * are themeable via `--ds-pin-input-*`.
 */
export function PinInput({
  value = "",
  length = 6,
  type = "numeric",
  mask = false,
  disabled = false,
  invalid: invalidProp = false,
  error,
  success = false,
  name,
  label,
  onValueChange,
  onComplete,
}: PinInputProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [errorId, message] = useFieldError(error);
  const invalid = invalidProp || !!error;
  const api = usePinInput({
    value,
    length,
    type,
    mask,
    disabled,
    onValueChange,
    onComplete,
    rootRef,
  });

  return (
    <>
      <div
        {...api.rootProps}
        ref={rootRef}
        className="pin-input"
        aria-label={label}
        data-invalid={invalid ? "" : undefined}
        data-success={!invalid && success ? "" : undefined}
      >
        {name ? (
          <input type="hidden" name={name} value={api.value} disabled={disabled || undefined} />
        ) : null}
        {api.values.map((_, index) => (
          <input
            key={index}
            {...api.getInputProps(index)}
            className="pin-input__cell"
            type={mask ? "password" : "text"}
            aria-invalid={invalid ? "true" : undefined}
            aria-describedby={errorId}
          />
        ))}
      </div>
      {message}
    </>
  );
}
