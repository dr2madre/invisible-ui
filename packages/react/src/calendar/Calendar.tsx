import { calendar as core, i18n as coreI18n } from "@design-system/core";
import { useMemo, type CSSProperties, type ReactNode } from "react";
import { useI18n, type TranslateFn } from "../i18n/i18n";
import type { MessageKey } from "../i18n/messages";
import { ChevronEndGlyph, ChevronStartGlyph, Icon } from "../icon/Icon";
import { cx } from "../internal/cx";
import { localDate } from "../internal/date";
import { SegmentedControl } from "../segmented-control/SegmentedControl";
import {
  useCalendar,
  type CalendarMode,
  type CalendarView,
  type UseCalendar,
  type WeekStart,
} from "./use-calendar";

/** An appointment on a given day, shown as a colored dot. */
export interface CalendarEvent {
  /** ISO `YYYY-MM-DD`. */
  date: string;
  /** Accessible description, also shown as a tooltip. */
  label?: string;
  /** Semantic tone for the dot. */
  tone?: "primary" | "success" | "warning" | "danger" | "neutral";
}

/** What `renderDay` receives for each day of the grid views. */
export interface CalendarDayContext {
  /** ISO `YYYY-MM-DD`. */
  date: string;
  /** Whether the day belongs to the month shown. */
  inMonth: boolean;
  /** Whether the day is the selected one. */
  selected: boolean;
  /** The day's events. */
  events: CalendarEvent[];
  /** The day's price label, if any. */
  price: string | undefined;
}

export interface CalendarProps {
  /** Initial (uncontrolled) or current (controlled) selected date, ISO `YYYY-MM-DD`. */
  value?: string | null;
  /** The date that drives what is shown and where focus sits. */
  focusedDate?: string;
  /** Initial (uncontrolled) or current (controlled) view. */
  view?: CalendarView;
  /** First day of the week, 0 = Sunday to 6. */
  weekStartsOn?: WeekStart;
  /** Earliest selectable date (ISO), inclusive. */
  min?: string;
  /** Latest selectable date (ISO), inclusive. */
  max?: string;
  /** BCP-47 locale for month and weekday names. Defaults to the provider's locale. */
  locale?: string;
  /** Appointment dots, keyed by their `date`. */
  events?: CalendarEvent[];
  /** Per-day price label, keyed by ISO date (e.g. `{ "2026-06-25": "€120" }`). */
  prices?: Record<string, string>;
  /** Maximum dots rendered before a "+N" overflow marker (grid views). */
  maxDots?: number;
  /** Year view: how many mini-months per row. */
  yearColumns?: number;
  /** Views offered in the built-in switcher. With one entry no switcher shows. */
  views?: CalendarView[];
  /** Override the switcher labels per view. */
  viewLabels?: Partial<Record<CalendarView, string>>;
  showToday?: boolean;
  /** Label of the previous button. Defaults to the catalog's. */
  prevLabel?: string;
  /** Label of the next button. Defaults to the catalog's. */
  nextLabel?: string;
  /** Text of the Today button. Defaults to the catalog's. */
  todayLabel?: string;
  /** Name of the view switcher. Defaults to the catalog's. */
  viewsLabel?: string;
  /** Accessible name for the grid. Defaults to the catalog's. */
  label?: string;
  /** Selection mode: a single date, or a start-to-end `range`. */
  mode?: CalendarMode;
  /** Range start (ISO), used when `mode="range"`. */
  rangeStart?: string | null;
  /** Range end (ISO), used when `mode="range"`. */
  rangeEnd?: string | null;
  /** Called when the user selects a date (single mode). */
  onValueChange?: (value: string) => void;
  /** Called when the user moves the focused date. */
  onFocusChange?: (value: string) => void;
  /** Called when the user changes the view. */
  onViewChange?: (view: CalendarView) => void;
  /** Called after each pick in range mode, with a `null` end while the range is half made. */
  onRangeChange?: (start: string | null, end: string | null) => void;
  /** Custom content of a day in the grid views, replacing the number, dots and price. */
  renderDay?: (day: CalendarDayContext) => ReactNode;
}

type Month = { year: number; month: number };

const NO_EVENTS: CalendarEvent[] = [];

// Local dates, like `localDate`: the formatters read local time, and a UTC
// midnight is the day before west of Greenwich.
/** A reference Sunday, so a weekday name can be rendered from an index. */
const weekdayName = (fmt: Intl.DateTimeFormat, weekday: number) =>
  fmt.format(new Date(2024, 0, 7 + weekday));

const monthDate = ({ year, month }: Month) => new Date(year, month - 1, 1);

/** The formatters a calendar renders with, cached by the core per locale. */
function formatters(locale: string) {
  const fmt = (options: Intl.DateTimeFormatOptions) => coreI18n.dateTimeFormat(locale, options);
  return {
    title: fmt({ month: "long", year: "numeric" }),
    range: fmt({ day: "numeric", month: "short", year: "numeric" }),
    day: fmt({ weekday: "long", day: "numeric", month: "long", year: "numeric" }),
    year: fmt({ year: "numeric" }),
    month: fmt({ month: "long" }),
    short: fmt({ weekday: "short" }),
    long: fmt({ weekday: "long" }),
    narrow: fmt({ weekday: "narrow" }),
  };
}

type Formatters = ReturnType<typeof formatters>;

/** A weekday column header: its index and its names. */
interface Weekday {
  weekday: WeekStart;
  long: string;
  short: string;
  narrow: string;
}

/** The consecutive days an agenda view shows. */
const agendaDays = (view: CalendarView, focused: string, weekStartsOn: WeekStart) =>
  view === "week"
    ? core.weekDays(focused, weekStartsOn)
    : core.rangeDays(focused, view === "three-day" ? 3 : 1);

function periodTitle(view: CalendarView, focused: string, weekStartsOn: WeekStart, f: Formatters) {
  switch (view) {
    case "year":
      return f.year.format(localDate(focused));
    case "day":
      return f.day.format(localDate(focused));
    case "week":
    case "three-day": {
      const days = agendaDays(view, focused, weekStartsOn);
      return f.range.formatRange(localDate(days[0]!.date), localDate(days.at(-1)!.date));
    }
    case "two-month": {
      const start = core.startOfMonth(focused);
      return f.title.formatRange(localDate(start), localDate(core.addMonths(start, 1)));
    }
    default:
      return f.title.format(localDate(focused));
  }
}

/**
 * Calendar: the styled calendar (WAI-ARIA date grid). Behaviour, date math and
 * keyboard navigation come from the headless calendar (`useCalendar`); this
 * layer adds the header (period title, an optional view switcher,
 * previous/next/today) and a body per view: `month`, `two-month`, `week`,
 * `three-day` and `day` (the last three are day-column agendas), and `year`
 * (twelve mini-months). Each day can show appointment dots (`events`) and a
 * price (`prices`), or custom content through `renderDay`.
 *
 * In `mode="range"` the first pick sets the start and the next the end; every
 * day of the range is a selected cell, and the endpoints say so in their name.
 * The value, the range, the focused date and the view are controllable mirrors
 * (ADR 0011). Month and weekday names come from `Intl` for the locale.
 * Themeable via `--ds-calendar-*`.
 */
export function Calendar({
  value = null,
  focusedDate,
  view = "month",
  weekStartsOn = 1,
  min,
  max,
  locale,
  events,
  prices = {},
  maxDots = 3,
  yearColumns = 1,
  views = ["month"],
  viewLabels = {},
  showToday = true,
  prevLabel,
  nextLabel,
  todayLabel,
  viewsLabel,
  label,
  mode = "single",
  rangeStart = null,
  rangeEnd = null,
  onValueChange,
  onFocusChange,
  onViewChange,
  onRangeChange,
  renderDay,
}: CalendarProps) {
  const i18n = useI18n();
  const { t } = i18n;
  const api = useCalendar({
    value,
    focusedDate,
    view,
    weekStartsOn,
    min,
    max,
    mode,
    rangeStart,
    rangeEnd,
    onValueChange,
    onFocusChange,
    onViewChange,
    onRangeChange,
  });
  const resolvedLocale = locale ?? i18n.locale;
  // Rendering a grid formats every day; the formatters, the weekday names and
  // the events by day are kept between renders that do not change them.
  const f = useMemo(() => formatters(resolvedLocale), [resolvedLocale]);
  const current = api.view;
  const focused = api.focusedDate;

  const byDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events ?? NO_EVENTS) {
      const list = map.get(event.date);
      if (list) list.push(event);
      else map.set(event.date, [event]);
    }
    return map;
  }, [events]);
  const weekdays = useMemo(
    () =>
      core.weekdayOrder(api.weekStartsOn).map((weekday) => ({
        weekday,
        long: weekdayName(f.long, weekday),
        short: weekdayName(f.short, weekday),
        narrow: weekdayName(f.narrow, weekday),
      })),
    [f, api.weekStartsOn],
  );

  const switcherItems = views.map((entry) => ({
    value: entry,
    label: viewLabels[entry] ?? t(`calendar.view.${entry}` as MessageKey),
  }));
  // The arrows point along the reading direction.
  const rtl = i18n.dir === "rtl";
  const body: BodyProps = {
    api,
    f,
    t,
    byDate,
    weekdays,
    prices,
    maxDots,
    gridLabel: label ?? t("calendar.label"),
    renderDay,
  };

  return (
    <section className="calendar" data-view={current} data-mode={mode}>
      <header className="calendar__header">
        <h2 className="calendar__title" aria-live="polite">
          {periodTitle(current, focused, api.weekStartsOn, f)}
        </h2>
        <div className="calendar__controls">
          {switcherItems.length > 1 ? (
            <SegmentedControl
              items={switcherItems}
              value={current}
              label={viewsLabel ?? t("calendar.viewsLabel")}
              onValueChange={(next) => api.setView(next as CalendarView)}
            />
          ) : null}
          <div className="calendar__nav">
            {showToday ? (
              <button type="button" className="calendar__today" onClick={api.goToday}>
                {todayLabel ?? t("calendar.today")}
              </button>
            ) : null}
            <button
              type="button"
              className="calendar__arrow"
              aria-label={prevLabel ?? t("calendar.previous")}
              onClick={api.goPrev}
            >
              <Icon size="1.25rem">{rtl ? <ChevronEndGlyph /> : <ChevronStartGlyph />}</Icon>
            </button>
            <button
              type="button"
              className="calendar__arrow"
              aria-label={nextLabel ?? t("calendar.next")}
              onClick={api.goNext}
            >
              <Icon size="1.25rem">{rtl ? <ChevronStartGlyph /> : <ChevronEndGlyph />}</Icon>
            </button>
          </div>
        </div>
      </header>
      {current === "month" || current === "two-month" ? (
        <MonthBody {...body} />
      ) : current === "year" ? (
        <YearBody {...body} columns={yearColumns} />
      ) : (
        <AgendaBody {...body} />
      )}
    </section>
  );
}

interface BodyProps {
  api: UseCalendar;
  f: Formatters;
  t: TranslateFn;
  byDate: Map<string, CalendarEvent[]>;
  weekdays: Weekday[];
  prices: Record<string, string>;
  maxDots: number;
  gridLabel: string;
  renderDay: CalendarProps["renderDay"];
}

/** A day's full date, then its events, its price and its place in a range. */
function dayLabel({ api, f, t, byDate, prices }: BodyProps, iso: string) {
  const count = (byDate.get(iso) ?? NO_EVENTS).length;
  const price = prices[iso];
  let text = f.day.format(localDate(iso));
  if (count) text += `, ${t("calendar.events", { count })}`;
  if (price) text += `, ${price}`;
  if (api.mode === "range") {
    if (iso === api.rangeStart) text += `, ${t("calendar.rangeStart")}`;
    if (iso === api.rangeEnd) text += `, ${t("calendar.rangeEnd")}`;
  }
  return text;
}

function WeekdayRow({ weekdays, narrow }: { weekdays: Weekday[]; narrow?: boolean }) {
  const prefix = narrow ? "calendar__mini-weekday" : "calendar__weekday";
  return (
    <div
      className={`calendar__row ${narrow ? "calendar__mini-weekdays" : "calendar__weekdays"}`}
      role="row"
    >
      {weekdays.map((day) => (
        <span key={day.weekday} className={prefix} role="columnheader" aria-label={day.long}>
          {narrow ? day.narrow : day.short}
        </span>
      ))}
    </div>
  );
}

const blankCell = (key: string) => (
  <div key={key} className="calendar__cell calendar__cell--blank" aria-hidden="true" />
);

/** An event's dot, in its tone. */
const Dot = ({ event }: { event: CalendarEvent }) => (
  <span className="calendar__dot" data-tone={event.tone ?? "primary"} title={event.label} />
);

function Dots({ events, maxDots }: { events: CalendarEvent[]; maxDots: number }) {
  return (
    <span className="calendar__dots" aria-hidden="true">
      {/* Events carry no id and two on one day may share a label, so their
          position is their key. */}
      {events.slice(0, maxDots).map((event, index) => (
        <Dot key={index} event={event} />
      ))}
      {events.length > maxDots ? (
        <span className="calendar__more">+{events.length - maxDots}</span>
      ) : null}
    </span>
  );
}

function MonthBody(props: BodyProps) {
  const { api, f, byDate, prices, maxDots, gridLabel, renderDay } = props;
  const twoMonth = api.view === "two-month";
  const ref = core.describe(api.focusedDate);
  const months: Month[] = [{ year: ref.year, month: ref.month }];
  if (twoMonth) {
    const next = core.describe(core.addMonths(api.focusedDate, 1));
    months.push({ year: next.year, month: next.month });
  }

  return (
    <div className="calendar__months">
      {months.map((month) => {
        const monthLabel = f.title.format(monthDate(month));
        return (
          <div className="calendar__month" key={`${month.year}-${month.month}`}>
            {twoMonth ? <h3 className="calendar__month-title">{monthLabel}</h3> : null}
            <div
              {...api.gridProps}
              className="calendar__grid"
              aria-label={twoMonth ? monthLabel : gridLabel}
            >
              <WeekdayRow weekdays={props.weekdays} />
              {core.monthMatrix(month.year, month.month, api.weekStartsOn).map((week, w) =>
                // Two months side by side show each day once, in its own month.
                twoMonth && !week.some((day) => day.month === month.month) ? null : (
                  <div {...api.rowProps} key={w} className="calendar__row calendar__week">
                    {week.map((cell) => {
                      const inMonth = cell.month === month.month;
                      if (twoMonth && !inMonth) return blankCell(cell.date);
                      const dayEvents = byDate.get(cell.date) ?? NO_EVENTS;
                      const price = prices[cell.date];
                      return (
                        <div
                          {...api.getCellProps(cell.date)}
                          key={cell.date}
                          className="calendar__cell"
                        >
                          <button
                            {...api.getDayProps(cell.date)}
                            className={cx("calendar__day", !inMonth && "calendar__day--outside")}
                            aria-label={dayLabel(props, cell.date)}
                          >
                            {renderDay ? (
                              renderDay({
                                date: cell.date,
                                inMonth,
                                selected: api.value === cell.date,
                                events: dayEvents,
                                price,
                              })
                            ) : (
                              <>
                                <span className="calendar__daynum">{cell.day}</span>
                                {dayEvents.length ? (
                                  <Dots events={dayEvents} maxDots={maxDots} />
                                ) : null}
                                {price ? <span className="calendar__price">{price}</span> : null}
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ),
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function YearBody({ api, f, weekdays, columns }: BodyProps & { columns: number }) {
  const year = core.describe(api.focusedDate).year;
  // The column count is the consumer's number; one column needs no override.
  const style = columns === 1 ? undefined : ({ "--year-cols": columns } as CSSProperties);
  return (
    <div className="calendar__year" style={style}>
      {core.monthsOfYear(year).map((month) => {
        const name = f.month.format(monthDate(month));
        return (
          <section className="calendar__mini" key={month.month}>
            <button
              type="button"
              className="calendar__mini-title"
              onClick={() => {
                api.setFocus(core.toISO(month.year, month.month, 1));
                api.setView("month");
              }}
            >
              {name}
            </button>
            <div {...api.gridProps} className="calendar__mini-grid" aria-label={name}>
              <WeekdayRow weekdays={weekdays} narrow />
              {core.monthMatrix(month.year, month.month, api.weekStartsOn).map((week, w) =>
                week.some((day) => day.month === month.month) ? (
                  <div {...api.rowProps} key={w} className="calendar__row calendar__mini-week">
                    {week.map((cell) =>
                      cell.month === month.month ? (
                        <div
                          {...api.getCellProps(cell.date)}
                          key={cell.date}
                          className="calendar__cell"
                        >
                          <button
                            {...api.getDayProps(cell.date)}
                            className="calendar__mini-day"
                            aria-label={f.day.format(localDate(cell.date))}
                          >
                            {cell.day}
                          </button>
                        </div>
                      ) : (
                        blankCell(cell.date)
                      ),
                    )}
                  </div>
                ) : null,
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function AgendaBody(props: BodyProps) {
  const { api, f, byDate, prices, gridLabel } = props;
  const days = agendaDays(api.view, api.focusedDate, api.weekStartsOn);

  return (
    <div
      {...api.gridProps}
      className="calendar__agenda"
      aria-label={gridLabel}
      data-cols={days.length}
    >
      <div {...api.rowProps} className="calendar__row calendar__agenda-row">
        {days.map((cell) => {
          const dayEvents = byDate.get(cell.date) ?? NO_EVENTS;
          const price = prices[cell.date];
          return (
            <div
              {...api.getCellProps(cell.date)}
              key={cell.date}
              className="calendar__cell calendar__agenda-col"
            >
              <button
                {...api.getDayProps(cell.date)}
                className="calendar__agenda-head"
                aria-label={dayLabel(props, cell.date)}
              >
                <span className="calendar__agenda-weekday">
                  {weekdayName(f.short, cell.weekday)}
                </span>
                <span className="calendar__agenda-num">{cell.day}</span>
              </button>
              <ul className="calendar__agenda-events">
                {/* Events carry no id and two on one day may share a label, so
                    their position is their key. */}
                {dayEvents.map((event, index) => (
                  <li key={index} className="calendar__event">
                    <span
                      className="calendar__dot"
                      data-tone={event.tone ?? "primary"}
                      aria-hidden="true"
                    />
                    <span className="calendar__event-label">{event.label}</span>
                  </li>
                ))}
                {price ? <li className="calendar__agenda-price">{price}</li> : null}
                {!dayEvents.length && !price ? (
                  <li className="calendar__agenda-empty" aria-hidden="true">
                    —
                  </li>
                ) : null}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
