/**
 * Calendar — framework-agnostic state and behaviour for a date grid following
 * the WAI-ARIA grid/date-picker pattern. Dates are plain ISO `YYYY-MM-DD`
 * strings (no time, no timezone) so the primitive is deterministic and easy to
 * serialise; all arithmetic is done in UTC to sidestep DST.
 */

/** The layout/period a calendar shows. */
export type CalendarView = "month" | "two-month" | "week" | "three-day" | "day" | "year";

/** Day of week a grid row starts on: 0 = Sunday … 6 = Saturday. */
export type WeekStart = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** User-provided options when creating a calendar. */
export interface CalendarContext {
  /** Selected date (ISO `YYYY-MM-DD`), or `null`. */
  value?: string | null;
  /** The date that drives what is shown / where focus sits. Defaults to `value` then today. */
  focusedDate?: string;
  /** Layout/period. Defaults to `"month"`. */
  view?: CalendarView;
  /** First day of the week. Defaults to `1` (Monday). */
  weekStartsOn?: WeekStart;
  /** Earliest selectable date (ISO), inclusive. */
  min?: string;
  /** Latest selectable date (ISO), inclusive. */
  max?: string;
  /** Number of months shown by the `two-month` view. Defaults to `2`. */
  monthCount?: number;
  /** Base id used to link grid elements. Auto-generated when omitted. */
  id?: string;
  onValueChange?: (value: string) => void;
  onFocusChange?: (focusedDate: string) => void;
  onViewChange?: (view: CalendarView) => void;
}

/** Internal, fully-resolved calendar state. */
export interface CalendarState {
  value: string | null;
  focusedDate: string;
  view: CalendarView;
  weekStartsOn: WeekStart;
  min: string | null;
  max: string | null;
  monthCount: number;
  id: string;
}

/** A single day cell descriptor produced by the matrix builders. */
export interface CalendarDay {
  /** ISO `YYYY-MM-DD`. */
  date: string;
  /** Day of month (1–31). */
  day: number;
  /** Month (1–12) this day belongs to. */
  month: number;
  /** Full year. */
  year: number;
  /** Day of week (0 = Sunday … 6 = Saturday). */
  weekday: WeekStart;
}
