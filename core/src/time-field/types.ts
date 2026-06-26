/**
 * Time Field — framework-agnostic state and behaviour for a segmented time
 * input (hour / minute / optional second / optional AM·PM), following the
 * WAI-ARIA spinbutton pattern per segment. The canonical value is a 24-hour
 * ISO time string (`HH:mm` or `HH:mm:ss`); segments are edited with arrows
 * (increment/decrement, wrapping) and typed digits.
 */

export type HourCycle = 12 | 24;

export type TimeSegmentType = "hour" | "minute" | "second" | "dayPeriod";

/** Resolved time parts (hour is always 0–23 internally; `null` = empty). */
export interface TimeParts {
  hour: number | null;
  minute: number | null;
  second: number | null;
}

/** User-provided options when creating a time field. */
export interface TimeFieldContext {
  /** Initial / controlled value, `"HH:mm"` or `"HH:mm:ss"` (24h), or `null`. */
  value?: string | null;
  /** 12- or 24-hour cycle (adds an AM/PM segment when 12). Defaults to 24. */
  hourCycle?: HourCycle;
  /** Include a seconds segment. Defaults to false. */
  withSeconds?: boolean;
  /** Base id used to link segments. Auto-generated when omitted. */
  id?: string;
  /** Called with the formatted value when all required segments are filled (else `null`). */
  onValueChange?: (value: string | null) => void;
}

/** Internal, fully-resolved time-field state. */
export interface TimeFieldState {
  parts: TimeParts;
  hourCycle: HourCycle;
  withSeconds: boolean;
  /** In-progress digit entry for the focused segment. */
  buffer: string;
  bufferSeg: TimeSegmentType | null;
  id: string;
}
