import type { TimeFieldContext, TimeFieldState, TimeParts, TimeSegmentType } from "./types";

let idCounter = 0;

export const pad2 = (n: number) => String(n).padStart(2, "0");

/** Parse `"HH:mm"` / `"HH:mm:ss"` into parts (all null when empty/invalid). */
export function parseValue(value: string | null | undefined): TimeParts {
  if (!value) return { hour: null, minute: null, second: null };
  const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(value);
  if (!m) return { hour: null, minute: null, second: null };
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  const second = m[3] != null ? Number(m[3]) : null;
  return {
    hour: hour >= 0 && hour <= 23 ? hour : null,
    minute: minute >= 0 && minute <= 59 ? minute : null,
    second: second != null && second >= 0 && second <= 59 ? second : null,
  };
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
export function from12(display: number, period: "AM" | "PM"): number {
  const h = display % 12;
  return period === "PM" ? h + 12 : h;
}

/** Format parts to the canonical 24h string, or `null` if a required part is missing. */
export function format(parts: TimeParts, withSeconds: boolean): string | null {
  if (parts.hour == null || parts.minute == null) return null;
  if (withSeconds && parts.second == null) return null;
  const base = `${pad2(parts.hour)}:${pad2(parts.minute)}`;
  return withSeconds ? `${base}:${pad2(parts.second ?? 0)}` : base;
}

export function initialState(context: TimeFieldContext): TimeFieldState {
  return {
    parts: parseValue(context.value),
    hourCycle: context.hourCycle ?? 24,
    withSeconds: context.withSeconds ?? false,
    buffer: "",
    bufferSeg: null,
    id: context.id ?? `ds-time-field-${++idCounter}`,
  };
}

/** Id of a segment element. */
export const segmentId = (baseId: string, seg: TimeSegmentType) => `${baseId}-${seg}`;
