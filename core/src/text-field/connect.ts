import { identityNormalize, type ElementProps, type Normalize } from "../types";
import { controlId, descriptionId, errorId, labelId } from "./state";
import type { TextFieldState } from "./types";

/** The public, framework-agnostic API for a connected text field. */
export interface TextFieldApi {
  /** Current value. */
  value: string;
  /** Whether the control is disabled. */
  disabled: boolean;
  /** Whether the field is invalid. */
  invalid: boolean;
  /** Set the value (ignored when disabled or read-only). */
  setValue(value: string): void;
  /** Props for the `<label>` (links to the control via `for`). */
  labelProps: ElementProps;
  /** Props for the control (`<input>` / `<textarea>`). */
  controlProps: ElementProps;
  /** Props for the description / hint element. */
  descriptionProps: ElementProps;
  /** Props for the error message element (a live region). */
  errorProps: ElementProps;
}

export interface ConnectOptions {
  /** Current resolved state. */
  state: TextFieldState;
  /** Request a new value; the adapter owns how state updates. */
  setValue: (value: string) => void;
  /** Framework adapter's prop normaliser. Defaults to identity. */
  normalize?: Normalize;
}

/**
 * Connect text-field state to prop getters. Follows the WAI-ARIA practices for
 * labelling form controls: a visible `<label>` tied to the control via `for`,
 * supplementary hint and error text linked through `aria-describedby`, and
 * `aria-invalid` / `aria-required` reflecting validation state. The error
 * element is a live region so a newly shown message is announced.
 */
export function connect({
  state,
  setValue,
  normalize = identityNormalize,
}: ConnectOptions): TextFieldApi {
  const { value, disabled, readOnly, required, invalid, hasDescription, id } = state;

  // Only reference ids whose elements are actually rendered, so screen readers
  // never chase a dangling aria-describedby target.
  const describedBy =
    [hasDescription ? descriptionId(id) : null, invalid ? errorId(id) : null]
      .filter(Boolean)
      .join(" ") || undefined;

  return {
    value,
    disabled,
    invalid,
    setValue: (next: string) => {
      if (disabled || readOnly) return;
      setValue(next);
    },
    labelProps: normalize({
      id: labelId(id),
      for: controlId(id),
      "data-disabled": disabled ? "" : undefined,
    }),
    controlProps: normalize({
      id: controlId(id),
      disabled: disabled || undefined,
      readonly: readOnly || undefined,
      required: required || undefined,
      "aria-invalid": invalid || undefined,
      "aria-required": required || undefined,
      "aria-describedby": describedBy,
      "data-disabled": disabled ? "" : undefined,
      "data-invalid": invalid ? "" : undefined,
    }),
    descriptionProps: normalize({
      id: descriptionId(id),
    }),
    errorProps: normalize({
      id: errorId(id),
      role: "alert",
      "data-invalid": invalid ? "" : undefined,
    }),
  };
}
