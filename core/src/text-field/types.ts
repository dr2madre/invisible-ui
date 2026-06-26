/**
 * A text-entry field: the framework-agnostic wiring shared by single-line
 * inputs and multi-line textareas. The native control already handles typing
 * and caret movement, so this primitive owns the parts that are easy to get
 * wrong: id generation and the label / description / error associations
 * (`for`, `aria-describedby`, `aria-invalid`, `aria-required`), plus the
 * disabled / read-only / invalid state flags surfaced as `data-*` hooks.
 */

/** Internal, fully-resolved state of a text field. */
export interface TextFieldState {
  /** Current value. */
  value: string;
  disabled: boolean;
  readOnly: boolean;
  required: boolean;
  /** Whether the field is in an invalid state (shows the error message). */
  invalid: boolean;
  /** Whether a description / hint element is present (affects describedby). */
  hasDescription: boolean;
  /** Base id used to link the label, control, description and error. */
  id: string;
}

/** User-provided options when creating a text field. */
export interface TextFieldContext {
  /** Initial / controlled value. Defaults to `""`. */
  value?: string;
  /** Whether the control is disabled. Defaults to `false`. */
  disabled?: boolean;
  /** Whether the control is read-only. Defaults to `false`. */
  readOnly?: boolean;
  /** Whether the control is required. Defaults to `false`. */
  required?: boolean;
  /** Whether the field is invalid. Defaults to `false`. */
  invalid?: boolean;
  /** Whether a description / hint element is present. Defaults to `false`. */
  hasDescription?: boolean;
  /** Base id used to link parts. Auto-generated when omitted. */
  id?: string;
  /** Called whenever the value changes. */
  onValueChange?: (value: string) => void;
}
