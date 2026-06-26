/** Internal, fully-resolved state of a progress bar. */
export interface ProgressState {
  /** Current value, or `null` when indeterminate (work of unknown length). */
  value: number | null;
  /** Minimum value. */
  min: number;
  /** Maximum value. */
  max: number;
  /** Base id (styling/labelling hook). */
  id: string;
}

/** User-provided options when creating a progress bar. */
export interface ProgressContext {
  /** Current value. Omit (or pass `null`) for an indeterminate bar. Defaults to `0`. */
  value?: number | null;
  /** Minimum value. Defaults to `0`. */
  min?: number;
  /** Maximum value. Defaults to `100`. */
  max?: number;
  /** Base id. Auto-generated when omitted. */
  id?: string;
}
