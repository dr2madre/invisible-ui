/**
 * A number field — a directly editable, locale-aware decimal input with
 * spinbutton semantics and increment/decrement controls. The user's editing
 * string and the canonical number are separate state: a draft is never
 * collapsed, reformatted mid-edit, silently clamped, or discarded.
 *
 * The native `input[type="number"]` cannot express this job: engines drop or
 * block locale decimal separators, hide partial drafts from script, and
 * refuse caret control. The component therefore uses a text input with
 * `inputmode="decimal"` and `role="spinbutton"`, parsing through the shared
 * i18n number symbols.
 */

/** How the current editing string reads. */
export type NumberInputStatus = "empty" | "incomplete" | "valid" | "invalid";

/** Why a value or draft is invalid. */
export type NumberFieldError = "parse" | "range-underflow" | "range-overflow" | "step-mismatch";

/** The result of parsing an editing string. */
export interface NumberParseResult {
  status: NumberInputStatus;
  /** The canonical number the string expresses, or `null`. */
  value: number | null;
  error: NumberFieldError | null;
}

/** Internal, fully-resolved state of a number field. */
export interface NumberFieldState {
  /** The canonical value, or `null` when empty. */
  value: number | null;
  /** The user's editing string (the draft), distinct from the value. */
  inputValue: string;
  /** The value at the last commit boundary. Escape restores it, and a
   *  commit that lands on it again stays silent. */
  committedValue: number | null;
  /** BCP-47 locale driving parsing and formatting. */
  locale: string;
  min: number | null;
  max: number | null;
  /** Step for the spin actions; also validated on typed values. */
  step: number;
  disabled: boolean;
  /** Review-only: focus works, editing and stepping do not. */
  readOnly: boolean;
  required: boolean;
  /** Opt-in wheel stepping while the input is focused and hovered. */
  changeOnWheel: boolean;
  /** Base id used to link the label, input and buttons. */
  id: string;
}

/** User-provided options when creating a number field. */
export interface NumberFieldContext {
  /** Initial / controlled value. Defaults to `null`. */
  value?: number | null;
  /** BCP-47 locale. Adapters default it to the provider's resolved locale. */
  locale?: string;
  min?: number;
  max?: number;
  /** Step for the spin actions. Defaults to `1`. */
  step?: number;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  /** Opt in to wheel stepping. Defaults to `false`. */
  changeOnWheel?: boolean;
  id?: string;
  /** Called when the canonical value changes while editing. */
  onValueChange?: (value: number | null) => void;
  /** Called at commit boundaries: blur, Enter and spin actions. */
  onValueCommit?: (value: number | null) => void;
}
