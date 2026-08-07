import type {
  DayPeriod,
  HourCycle,
  TimeFieldContext,
  TimeFieldState,
  TimeParseResult,
  TimeParts,
  TimeSegmentType,
} from "./types";

let idCounter = 0;

export const pad2 = (n: number) => String(n).padStart(2, "0");

export const emptyParts = (): TimeParts => ({
  hour: null,
  minute: null,
  second: null,
  dayPeriod: null,
});

export interface ParseTimeValueOptions {
  /** Require seconds (`true`), reject seconds (`false`), or accept either when omitted. */
  withSeconds?: boolean;
  /** Derive the presentation period for a valid canonical value in 12-hour mode. */
  hourCycle?: HourCycle;
}

/** Parse a flexible time value and return a canonical 24-hour representation. */
export function parseTimeValue(
  value: string | null | undefined,
  options: ParseTimeValueOptions = {},
): TimeParseResult {
  if (!value) {
    return {
      status: "empty",
      parts: emptyParts(),
      canonical: null,
      error: null,
      invalidSegment: null,
      normalized: false,
    };
  }
  const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(value);
  if (!m) {
    return {
      status: "invalid",
      parts: emptyParts(),
      canonical: null,
      error: "invalid-format",
      invalidSegment: null,
      normalized: false,
    };
  }

  const hasSeconds = m[3] != null;
  if (options.withSeconds === true && !hasSeconds) {
    return {
      status: "invalid",
      parts: emptyParts(),
      canonical: null,
      error: "seconds-required",
      invalidSegment: "second",
      normalized: false,
    };
  }
  if (options.withSeconds === false && hasSeconds) {
    return {
      status: "invalid",
      parts: emptyParts(),
      canonical: null,
      error: "seconds-not-allowed",
      invalidSegment: "second",
      normalized: false,
    };
  }

  const hour = Number(m[1]);
  const minute = Number(m[2]);
  const second = m[3] != null ? Number(m[3]) : null;

  const invalidSegment =
    hour < 0 || hour > 23
      ? "hour"
      : minute < 0 || minute > 59
        ? "minute"
        : second != null && (second < 0 || second > 59)
          ? "second"
          : null;
  if (invalidSegment) {
    return {
      status: "invalid",
      parts: emptyParts(),
      canonical: null,
      error: "out-of-range",
      invalidSegment,
      normalized: false,
    };
  }

  const canonical = `${pad2(hour)}:${pad2(minute)}${second == null ? "" : `:${pad2(second)}`}`;
  return {
    status: "valid",
    parts: {
      hour,
      minute,
      second,
      dayPeriod: options.hourCycle === 12 ? periodOf(hour) : null,
    },
    canonical,
    error: null,
    invalidSegment: null,
    normalized: canonical !== value,
  };
}

/** Parse into parts; empty and invalid values are rejected atomically. */
export function parseValue(
  value: string | null | undefined,
  options: ParseTimeValueOptions = {},
): TimeParts {
  return parseTimeValue(value, options).parts;
}

/** Ordered segments for the given configuration. */
export function segments(hourCycle: 12 | 24, withSeconds: boolean): TimeSegmentType[] {
  const segs: TimeSegmentType[] = ["hour", "minute"];
  if (withSeconds) segs.push("second");
  if (hourCycle === 12) segs.push("dayPeriod");
  return segs;
}

/** Inclusive numeric bounds for a segment, given the hour cycle. */
export function bounds(seg: TimeSegmentType, hourCycle: 12 | 24): { min: number; max: number } {
  if (seg === "hour") return hourCycle === 12 ? { min: 1, max: 12 } : { min: 0, max: 23 };
  return { min: 0, max: 59 };
}

/** The 12-hour display hour for an internal 0–23 hour. */
export const to12 = (hour: number) => (hour % 12 === 0 ? 12 : hour % 12);

/** The AM/PM period for an internal 0–23 hour. */
export const periodOf = (hour: number): "AM" | "PM" => (hour >= 12 ? "PM" : "AM");

/** Compose an internal 0–23 hour from a 12-hour display value + period. */
export function from12(display: number, period: DayPeriod): number {
  const h = display % 12;
  return period === "PM" ? h + 12 : h;
}

/** Format parts to the canonical 24h string, or `null` if a required part is missing. */
export function format(
  parts: TimeParts,
  withSeconds: boolean,
  hourCycle: HourCycle = 24,
): string | null {
  if (parts.hour == null || parts.minute == null) return null;
  if (withSeconds && parts.second == null) return null;
  if (hourCycle === 12 && parts.dayPeriod == null) return null;
  const base = `${pad2(parts.hour)}:${pad2(parts.minute)}`;
  return withSeconds ? `${base}:${pad2(parts.second ?? 0)}` : base;
}

export function initialState(context: TimeFieldContext): TimeFieldState {
  const hourCycle = context.hourCycle ?? 24;
  const withSeconds = context.withSeconds ?? false;
  const parsed = parseTimeValue(context.value, { hourCycle, withSeconds });
  return {
    parts: parsed.parts,
    hourCycle,
    withSeconds,
    validationError: parsed.error,
    invalidSegment: parsed.invalidSegment,
    buffer: "",
    bufferSeg: null,
    id: context.id ?? `ds-time-field-${++idCounter}`,
  };
}

/** Id of a segment element. */
export const segmentId = (baseId: string, seg: TimeSegmentType) => `${baseId}-${seg}`;
