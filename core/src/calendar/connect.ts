import { identityNormalize, type ElementProps, type Normalize } from "../types";
import { addDays, addMonths, addYears, clamp, dayId, inRange, startOfWeek, today } from "./state";
import type { CalendarState, CalendarView } from "./types";

/** The public, framework-agnostic API for a connected calendar. */
export interface CalendarApi {
  view: CalendarView;
  focusedDate: string;
  value: string | null;
  /** Select a date (ignored when out of `[min, max]`). */
  setValue(iso: string): void;
  /** Move focus to a date (clamped into range). */
  setFocus(iso: string): void;
  setView(view: CalendarView): void;
  /** Step back one period (month / week / 3 days / day / year per the view). */
  goPrev(): void;
  /** Step forward one period. */
  goNext(): void;
  /** Move focus to today (clamped into range). */
  goToday(): void;
  /** Whether a date is selectable. */
  isSelectable(iso: string): boolean;
  /** Props for the grid container (`role="grid"`). */
  gridProps: ElementProps;
  /** Props for a grid row (`role="row"`). */
  rowProps: ElementProps;
  /** Props for a day cell wrapper (`role="gridcell"`). */
  getCellProps(iso: string): ElementProps;
  /** Props for the focusable day button. */
  getDayProps(iso: string): ElementProps;
}

export interface ConnectOptions {
  state: CalendarState;
  setValue: (iso: string) => void;
  setFocus: (iso: string) => void;
  setView: (view: CalendarView) => void;
  /** Move DOM focus to the day with the given ISO date (adapter-provided). */
  focus?: (iso: string) => void;
  normalize?: Normalize;
}

/** How far one prev/next step moves, by view. */
function step(view: CalendarView, iso: string, dir: 1 | -1): string {
  switch (view) {
    case "week":
      return addDays(iso, dir * 7);
    case "three-day":
      return addDays(iso, dir * 3);
    case "day":
      return addDays(iso, dir * 1);
    case "year":
      return addYears(iso, dir);
    case "month":
    case "two-month":
    default:
      return addMonths(iso, dir);
  }
}

/**
 * Connect calendar state to prop getters following the WAI-ARIA date-grid
 * pattern (https://www.w3.org/WAI/ARIA/apg/patterns/datepicker-dialog/): a
 * `role="grid"` of day buttons with roving tabindex and arrow / Home / End /
 * PageUp / PageDown keyboard navigation. Arrows move focus by day and week;
 * Home/End jump to the week edges; PageUp/Down step a month (Shift = a year);
 * Enter/Space selects.
 */
export function connect({
  state,
  setValue,
  setFocus,
  setView,
  focus,
  normalize = identityNormalize,
}: ConnectOptions): CalendarApi {
  const { value, focusedDate, view, weekStartsOn, min, max, id } = state;

  const selectable = (iso: string) => inRange(iso, min, max);

  const select = (iso: string) => {
    if (!selectable(iso)) return;
    setValue(iso);
    setFocus(iso);
  };

  const moveFocus = (iso: string) => {
    const next = clamp(iso, min, max);
    setFocus(next);
    focus?.(next);
  };

  return {
    view,
    focusedDate,
    value,
    isSelectable: selectable,
    setValue: select,
    setFocus: moveFocus,
    setView,
    goPrev: () => setFocus(step(view, focusedDate, -1)),
    goNext: () => setFocus(step(view, focusedDate, 1)),
    goToday: () => moveFocus(today()),
    gridProps: normalize({ role: "grid" }),
    rowProps: normalize({ role: "row" }),
    getCellProps: (iso: string) =>
      normalize({
        role: "gridcell",
        "aria-selected": value === iso ? true : undefined,
      }),
    getDayProps: (iso: string) => {
      const selected = value === iso;
      const disabled = !selectable(iso);
      const isToday = iso === today();
      return normalize({
        type: "button",
        id: dayId(id, iso),
        "data-date": iso,
        "aria-disabled": disabled || undefined,
        "aria-current": isToday ? "date" : undefined,
        tabindex: iso === focusedDate ? 0 : -1,
        "data-selected": selected ? "" : undefined,
        "data-today": isToday ? "" : undefined,
        "data-disabled": disabled ? "" : undefined,
        onClick: () => select(iso),
        onKeyDown: (event: Event) => {
          const e = event as KeyboardEvent;
          switch (e.key) {
            case "ArrowRight":
              e.preventDefault();
              moveFocus(addDays(focusedDate, 1));
              break;
            case "ArrowLeft":
              e.preventDefault();
              moveFocus(addDays(focusedDate, -1));
              break;
            case "ArrowDown":
              e.preventDefault();
              moveFocus(addDays(focusedDate, 7));
              break;
            case "ArrowUp":
              e.preventDefault();
              moveFocus(addDays(focusedDate, -7));
              break;
            case "Home":
              e.preventDefault();
              moveFocus(startOfWeek(focusedDate, weekStartsOn));
              break;
            case "End":
              e.preventDefault();
              moveFocus(addDays(startOfWeek(focusedDate, weekStartsOn), 6));
              break;
            case "PageUp":
              e.preventDefault();
              moveFocus(e.shiftKey ? addYears(focusedDate, -1) : addMonths(focusedDate, -1));
              break;
            case "PageDown":
              e.preventDefault();
              moveFocus(e.shiftKey ? addYears(focusedDate, 1) : addMonths(focusedDate, 1));
              break;
            case "Enter":
            case " ":
              e.preventDefault();
              select(iso);
              break;
          }
        },
      });
    },
  };
}
