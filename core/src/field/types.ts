/** Internal, fully-resolved state of a field. */
export interface FieldState {
  /** Base id used to derive the label/control/description/error ids. */
  id: string;
  /** Whether the control is required. */
  required: boolean;
  /** Whether the field is in an invalid (error) state. */
  invalid: boolean;
  /** Whether the field is disabled. */
  disabled: boolean;
  /** Whether a description is present (so it can be linked). */
  hasDescription: boolean;
  /** Whether an error message is present (so it can be linked). */
  hasError: boolean;
}

/** User-provided options when creating a field. */
export interface FieldContext {
  /** Base id. Auto-generated when omitted. */
  id?: string;
  /** Whether the control is required. Defaults to `false`. */
  required?: boolean;
  /** Whether the field is invalid. Defaults to `false`. */
  invalid?: boolean;
  /** Whether the field is disabled. Defaults to `false`. */
  disabled?: boolean;
  /** Whether a description is present. Defaults to `false`. */
  hasDescription?: boolean;
  /** Whether an error message is present. Defaults to `false`. */
  hasError?: boolean;
}
