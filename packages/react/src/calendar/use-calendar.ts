import { calendar as core, type ElementProps } from "@design-system/core";
import { useEffect, useId, useState, type KeyboardEvent } from "react";
import { useControllable } from "../internal/controllable";
import { asDate } from "../internal/date";
import { normalizeProps } from "../normalize";

export type CalendarView = core.CalendarView;
export type WeekStart = core.WeekStart;
export type CalendarDay = core.CalendarDay;
/** Selection mode: a single date, or a start-to-end range. */
export type CalendarMode = "single" | "range";

export interface UseCalendarOptions {
  /** Selected date (ISO `YYYY-MM-DD`), or `null`. Single mode only. */
  value?: string | null;
  /** The date that drives what is shown and where focus sits. */
  focusedDate?: string;
  /** Layout and period. Defaults to `"month"`. */
  view?: CalendarView;
  /** First day of the week, 0 = Sunday to 6. Defaults to `1` (Monday). */
  weekStartsOn?: WeekStart;
  /** Earliest selectable date (ISO), inclusive. */
  min?: string;
  /** Latest selectable date (ISO), inclusive. */
  max?: string;
  /** Selection mode. Defaults to `"single"`. */
  mode?: CalendarMode;
  /** Range start (ISO), used when `mode="range"`. */
  rangeStart?: string | null;
  /** Range end (ISO), used when `mode="range"`. */
  rangeEnd?: string | null;
  /** Explicit base id; a stable one is generated when omitted. */
  id?: string;
  onValueChange?: (value: string) => void;
  onFocusChange?: (focusedDate: string) => void;
  onViewChange?: (view: CalendarView) => void;
  onRangeChange?: (start: string | null, end: string | null) => void;
}

export interface UseCalendar extends core.CalendarApi {
  weekStartsOn: WeekStart;
  mode: CalendarMode;
  rangeStart: string | null;
  rangeEnd: string | null;
}

/**
 * Connect the headless calendar (WAI-ARIA date grid) to React. Behaviour and
 * all date arithmetic live in `@design-system/core`: a roving tab stop on the
 * focused day, arrow, Home, End, PageUp and PageDown navigation, selection
 * bounded by `[min, max]`. This hook owns the value, the range, the focused
 * date and the view as controllable mirrors (ADR 0011), and moves DOM focus to
 * the day the core asks for once that day is rendered.
 *
 * In range mode a pick extends or restarts the range (the core's
 * `extendRange`), every day of the range is a selected cell, and the
 * endpoints carry `data-range-start` and `data-range-end`. In right-to-left
 * text ArrowLeft and ArrowRight follow the visual direction.
 */
export function useCalendar({
  value: valueProp = null,
  focusedDate: focusedProp,
  view: viewProp = "month",
  weekStartsOn = 1,
  min,
  max,
  mode = "single",
  rangeStart: startProp = null,
  rangeEnd: endProp = null,
  id: idProp,
  onValueChange,
  onFocusChange,
  onViewChange,
  onRangeChange,
}: UseCalendarOptions = {}): UseCalendar {
  const generatedId = `ds-calendar-${useId()}`;
  const id = idProp ?? generatedId;
  const range = mode === "range";

  // Each mirror reflects its prop silently; the reports happen on a user
  // action that moved the piece of state they name.
  const [value, setValue] = useControllable(asDate(valueProp), undefined);
  const [start, setStart] = useControllable(asDate(startProp), undefined);
  const [end, setEnd] = useControllable(asDate(endProp), undefined);
  const [view, setView] = useControllable(viewProp, onViewChange);
  const [focused, setFocused] = useState(
    () => asDate(focusedProp) ?? asDate(valueProp) ?? asDate(startProp) ?? core.today(),
  );
  const [lastFocusedProp, setLastFocusedProp] = useState(focusedProp);
  if (focusedProp !== lastFocusedProp) {
    setLastFocusedProp(focusedProp);
    if (focusedProp) setFocused(focusedProp);
  }

  // DOM focus follows once the day is rendered: a step into the next month
  // asks for a day that does not exist yet. A fresh object per request, so a
  // request for the day already focused still runs.
  const [focusRequest, setFocusRequest] = useState<{ iso: string } | null>(null);
  useEffect(() => {
    if (focusRequest) document.getElementById(core.dayId(id, focusRequest.iso))?.focus();
  }, [focusRequest, id]);

  const select = (iso: string) => {
    if (range) {
      const next = core.extendRange({ start, end }, iso);
      setStart(next.start);
      setEnd(next.end);
      onRangeChange?.(next.start, next.end);
      return;
    }
    if (iso === value) return;
    setValue(iso);
    onValueChange?.(iso);
  };

  const api = core.connect({
    state: {
      value: range ? null : value,
      focusedDate: focused,
      view,
      weekStartsOn,
      min: asDate(min),
      max: asDate(max),
      id,
    },
    setValue: select,
    setFocus: (iso) => {
      if (iso === focused) return;
      setFocused(iso);
      onFocusChange?.(iso);
    },
    setView,
    focus: (iso) => setFocusRequest({ iso }),
    normalize: normalizeProps,
  });

  const between = (iso: string) => range && core.isWithinRange({ start, end }, iso);
  const isStart = (iso: string) => range && iso === start;
  const isEnd = (iso: string) => range && iso === end;

  return {
    ...api,
    weekStartsOn,
    mode,
    rangeStart: start,
    rangeEnd: end,
    // Every day of a range is selected, not only the single value the core
    // knows about.
    getCellProps: (iso) => {
      const props = api.getCellProps(iso);
      return isStart(iso) || isEnd(iso) || between(iso)
        ? { ...props, "aria-selected": true }
        : props;
    },
    getDayProps: (iso) => {
      const props: ElementProps = api.getDayProps(iso);
      const onKeyDown = props.onKeyDown as (event: KeyboardEvent<HTMLElement>) => void;
      return {
        ...props,
        "data-range-start": isStart(iso) ? "" : undefined,
        "data-range-end": isEnd(iso) ? "" : undefined,
        "data-in-range": between(iso) ? "" : undefined,
        // The core counts ArrowRight as the next day. In right-to-left text the
        // next day sits to the left, so the two keys swap.
        onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
          const { key } = event;
          if (
            (key === "ArrowLeft" || key === "ArrowRight") &&
            getComputedStyle(event.currentTarget).direction === "rtl"
          ) {
            event.preventDefault();
            api.setFocus(core.addDays(focused, key === "ArrowLeft" ? 1 : -1));
            return;
          }
          onKeyDown(event);
        },
      };
    },
  };
}
