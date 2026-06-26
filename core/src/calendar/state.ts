import type { CalendarContext, CalendarDay, CalendarState, WeekStart } from "./types";

let idCounter = 0;

/* ------------------------------------------------------------------ *
 * Date helpers — operate on ISO `YYYY-MM-DD` strings, in UTC.
 * ------------------------------------------------------------------ */

const pad = (n: number) => String(n).padStart(2, "0");

/** Parse an ISO `YYYY-MM-DD` into a UTC Date at midnight. */
function parse(iso: string): Date {
  const parts = iso.split("-");
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  return new Date(Date.UTC(y, m - 1, d));
}

/** Format a UTC Date as ISO `YYYY-MM-DD`. */
function format(date: Date): string {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/** Build an ISO date from year / month (1–12) / day. */
export function toISO(year: number, month: number, day: number): string {
  return format(new Date(Date.UTC(year, month - 1, day)));
}

/** Today's date as ISO `YYYY-MM-DD` (local calendar day). */
export function today(): string {
  const now = new Date();
  return toISO(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

export function addDays(iso: string, n: number): string {
  const d = parse(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return format(d);
}

export function addMonths(iso: string, n: number): string {
  const d = parse(iso);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + n);
  // Clamp to the last day of the destination month (e.g. Jan 31 + 1m → Feb 28).
  const last = daysInMonth(d.getUTCFullYear(), d.getUTCMonth() + 1);
  d.setUTCDate(Math.min(day, last));
  return format(d);
}

export function addYears(iso: string, n: number): string {
  return addMonths(iso, n * 12);
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Day of week, 0 = Sunday … 6 = Saturday. */
export function weekday(iso: string): WeekStart {
  return parse(iso).getUTCDay() as WeekStart;
}

export function startOfMonth(iso: string): string {
  const { year, month } = describe(iso);
  return toISO(year, month, 1);
}

/** Start of the week containing `iso`, given the configured first weekday. */
export function startOfWeek(iso: string, weekStartsOn: WeekStart): string {
  const diff = (weekday(iso) - weekStartsOn + 7) % 7;
  return addDays(iso, -diff);
}

export function compare(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function isSameDay(a: string, b: string): boolean {
  return a === b;
}

export function isSameMonth(a: string, b: string): boolean {
  const da = describe(a);
  const db = describe(b);
  return da.year === db.year && da.month === db.month;
}

/** Break an ISO date into its parts. */
export function describe(iso: string): CalendarDay {
  const d = parse(iso);
  return {
    date: iso,
    day: d.getUTCDate(),
    month: d.getUTCMonth() + 1,
    year: d.getUTCFullYear(),
    weekday: d.getUTCDay() as WeekStart,
  };
}

/** Clamp an ISO date into the inclusive `[min, max]` range (nulls = unbounded). */
export function clamp(iso: string, min: string | null, max: string | null): string {
  if (min && compare(iso, min) < 0) return min;
  if (max && compare(iso, max) > 0) return max;
  return iso;
}

export function inRange(iso: string, min: string | null, max: string | null): boolean {
  if (min && compare(iso, min) < 0) return false;
  if (max && compare(iso, max) > 0) return false;
  return true;
}

/* ------------------------------------------------------------------ *
 * Matrix builders — pure, used by the styled layer to render grids.
 * ------------------------------------------------------------------ */

/** `count` consecutive days starting at `startISO`. */
export function rangeDays(startISO: string, count: number): CalendarDay[] {
  const days: CalendarDay[] = [];
  for (let i = 0; i < count; i++) days.push(describe(addDays(startISO, i)));
  return days;
}

/** The 7 days of the week containing `iso`. */
export function weekDays(iso: string, weekStartsOn: WeekStart): CalendarDay[] {
  return rangeDays(startOfWeek(iso, weekStartsOn), 7);
}

/**
 * A month grid as weeks of 7 days. Always fills whole weeks, padding with the
 * trailing days of the previous month and leading days of the next so every
 * row has 7 cells. Returns 6 rows for layout stability.
 */
export function monthMatrix(year: number, month: number, weekStartsOn: WeekStart): CalendarDay[][] {
  const first = toISO(year, month, 1);
  const gridStart = startOfWeek(first, weekStartsOn);
  const weeks: CalendarDay[][] = [];
  for (let w = 0; w < 6; w++) {
    weeks.push(rangeDays(addDays(gridStart, w * 7), 7));
  }
  return weeks;
}

/** Ordered weekday indices starting at `weekStartsOn` (e.g. [1,2,3,4,5,6,0]). */
export function weekdayOrder(weekStartsOn: WeekStart): WeekStart[] {
  return Array.from({ length: 7 }, (_, i) => ((weekStartsOn + i) % 7) as WeekStart);
}

/** The 12 months of `year` as `{ year, month }` pairs. */
export function monthsOfYear(year: number): Array<{ year: number; month: number }> {
  return Array.from({ length: 12 }, (_, i) => ({ year, month: i + 1 }));
}

/* ------------------------------------------------------------------ */

/** Build the initial state from user context. */
export function initialState(context: CalendarContext): CalendarState {
  const value = context.value ?? null;
  const focusedDate = context.focusedDate ?? value ?? today();
  return {
    value,
    focusedDate,
    view: context.view ?? "month",
    weekStartsOn: context.weekStartsOn ?? 1,
    min: context.min ?? null,
    max: context.max ?? null,
    monthCount: context.monthCount ?? 2,
    id: context.id ?? `ds-calendar-${++idCounter}`,
  };
}

/** Id of a day cell button for an ISO date. */
export const dayId = (baseId: string, iso: string) => `${baseId}-day-${iso}`;
