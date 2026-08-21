/**
 * Time Field — framework-agnostic state and behaviour for a segmented time
 * input (hour / minute / optional second / optional AM·PM), following the
 * WAI-ARIA spinbutton pattern per segment. The canonical value is a 24-hour
 * ISO time string (`HH:mm` or `HH:mm:ss`); segments are edited with arrows
 * (increment/decrement, wrapping) and typed digits.
 */

export type HourCycle = 12 | 24;

export type DayPeriod = "AM" | "PM";

export type TimeSegmentType = "hour" | "minute" | "second" | "dayPeriod";

export type TimeInputStatus = "empty" | "incomplete" | "valid" | "invalid";

export type TimeValueError =
  | "invalid-format"
  | "out-of-range"
  | "seconds-required"
  | "seconds-not-allowed"
  | "range-underflow"
  | "range-overflow";

/** Resolved time parts (hour is always 0–23 internally; `null` = empty). */
export interface TimeParts {
  hour: number | null;
  minute: number | null;
  second: number | null;
  /** Required to publish a value in 12-hour mode; never inferred for empty input. */
  dayPeriod: DayPeriod | null;
}

export interface TimeParseResult {
  status: "empty" | "valid" | "invalid";
  parts: TimeParts;
  /** Canonical 24-hour value when valid. */
  canonical: string | null;
  error: TimeValueError | null;
  invalidSegment: Exclude<TimeSegmentType, "dayPeriod"> | null;
  /** Whether a valid non-canonical value, such as `9:30`, was padded. */
  normalized: boolean;
}

/** User-provided options when creating a time field. */
export interface TimeFieldContext {
  /** Initial / controlled value, `"HH:mm"` or `"HH:mm:ss"` (24h), or `null`. */
  value?: string | null;
  /** 12- or 24-hour cycle (adds an AM/PM segment when 12). Defaults to 24. */
  hourCycle?: HourCycle;
  /** Include a seconds segment. Defaults to false. */
  withSeconds?: boolean;
  /** Earliest acceptable time (`"HH:mm[:ss]"`), inclusive. */
  min?: string;
  /** Latest acceptable time (`"HH:mm[:ss]"`), inclusive. */
  max?: string;
  /** Base id used to link segments. Auto-generated when omitted. */
  id?: string;
  /** Called with the formatted value when all required segments are filled (else `null`). */
  onValueChange?: (value: string | null) => void;
  /**
   * Called when the user finishes editing: focus leaves the field, or Enter is
   * pressed. A form uses this to validate once, instead of on every keystroke.
   */
  onValueCommit?: (value: string | null) => void;
}

/** Internal, fully-resolved time-field state. */
export interface TimeFieldState {
  parts: TimeParts;
  /** The parts as they stood at the last commit; Escape puts these back. */
  committedParts: TimeParts;
  hourCycle: HourCycle;
  withSeconds: boolean;
  /** Earliest acceptable time, or `null` when unbounded. */
  min: string | null;
  /** Latest acceptable time, or `null` when unbounded. */
  max: string | null;
  validationError: TimeValueError | null;
  invalidSegment: Exclude<TimeSegmentType, "dayPeriod"> | null;
  /** In-progress digit entry for the focused segment. */
  buffer: string;
  bufferSeg: TimeSegmentType | null;
  id: string;
}
