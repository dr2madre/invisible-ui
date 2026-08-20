import { calendar as core, i18n as coreI18n } from "@design-system/core";
import { computed, defineComponent, h, ref, watch, type PropType, type VNodeChild } from "vue";
import { Icon } from "../icon/Icon";
import { useI18n } from "../i18n/i18n";
import type { MessageKey } from "../i18n/messages";
import { SegmentedControl } from "../segmented-control/SegmentedControl";
import { useCalendar, type CalendarView, type WeekStart } from "./use-calendar";

/** An appointment on a given day, shown as a colored dot. */
export interface CalendarEvent {
  /** ISO `YYYY-MM-DD`. */
  date: string;
  /** Accessible description (announced; also a tooltip via `title`). */
  label?: string;
  /** Semantic tone for the dot. */
  tone?: "primary" | "success" | "warning" | "danger" | "neutral";
}

/** Selection mode: a single date, or a start-to-end range. */
export type CalendarMode = "single" | "range";

export interface CalendarProps {
  /** Selected date (ISO `YYYY-MM-DD`); bindable with `v-model`. */
  modelValue?: string | null;
  value?: string | null;
  focusedDate?: string;
  view?: CalendarView;
  weekStartsOn?: WeekStart;
  min?: string;
  max?: string;
  /** BCP-47 locale for month and weekday names. Defaults to the runtime locale. */
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
  prevLabel?: string;
  nextLabel?: string;
  todayLabel?: string;
  viewsLabel?: string;
  /** Accessible name for the grid. */
  label?: string;
  mode?: CalendarMode;
  /** Range endpoints (ISO), used when `mode="range"`. */
  rangeStart?: string | null;
  rangeEnd?: string | null;
  onValueChange?: (value: string) => void;
  onFocusChange?: (value: string) => void;
  onViewChange?: (view: CalendarView) => void;
  onRangeChange?: (start: string | null, end: string | null) => void;
}

/** A reference Sunday, so a weekday name can be rendered from an index. */
const weekdayName = (fmt: Intl.DateTimeFormat, weekday: number) =>
  fmt.format(new Date(Date.UTC(2024, 0, 7 + weekday)));

/**
 * Calendar: the styled, batteries-included calendar (WAI-ARIA date grid).
 * Behaviour, date math and keyboard navigation come from the headless calendar
 * (`@design-system/core`); this layer adds the header (period label, an
 * optional view switcher, prev/next/today) and a body per view.
 *
 * Views: `month`, `two-month` (two months side by side), `week`, `three-day`
 * and `day` (the last three are day-column agendas), plus `year` (twelve
 * mini-months). Each day can show appointment dots (`events`) and a price
 * (`prices`), or custom content through the `day` slot
 * (`{ date, inMonth, selected, events, price }`). The selected date binds two
 * ways: `v-model` or the `value` prop plus `onValueChange`. Colors, radius and
 * sizing are themeable via `--ds-calendar-*`.
 */
export const Calendar = defineComponent({
  name: "Calendar",
  props: {
    modelValue: { type: String as PropType<string | null>, default: undefined },
    value: { type: String as PropType<string | null>, default: null },
    focusedDate: { type: String, default: undefined },
    view: { type: String as PropType<CalendarView>, default: "month" },
    weekStartsOn: { type: Number as PropType<WeekStart>, default: 1 },
    min: { type: String, default: undefined },
    max: { type: String, default: undefined },
    locale: { type: String, default: undefined },
    events: { type: Array as PropType<CalendarEvent[]>, default: () => [] },
    prices: { type: Object as PropType<Record<string, string>>, default: () => ({}) },
    maxDots: { type: Number, default: 3 },
    yearColumns: { type: Number, default: 1 },
    views: { type: Array as PropType<CalendarView[]>, default: () => ["month"] },
    viewLabels: {
      type: Object as PropType<Partial<Record<CalendarView, string>>>,
      default: () => ({}),
    },
    showToday: { type: Boolean, default: true },
    prevLabel: { type: String, default: undefined },
    nextLabel: { type: String, default: undefined },
    todayLabel: { type: String, default: undefined },
    viewsLabel: { type: String, default: undefined },
    label: { type: String, default: undefined },
    mode: { type: String as PropType<CalendarMode>, default: "single" },
    rangeStart: { type: String as PropType<string | null>, default: null },
    rangeEnd: { type: String as PropType<string | null>, default: null },
    onValueChange: { type: Function as PropType<(value: string) => void>, default: undefined },
    onFocusChange: { type: Function as PropType<(value: string) => void>, default: undefined },
    onViewChange: {
      type: Function as PropType<(view: CalendarView) => void>,
      default: undefined,
    },
    onRangeChange: {
      type: Function as PropType<(start: string | null, end: string | null) => void>,
      default: undefined,
    },
  },
  emits: {
    "update:modelValue": (value: string) => typeof value === "string",
  },
  setup(props, { emit, slots }) {
    const i18n = useI18n();
    // The explicit prop wins, then the provider's resolved locale; never the
    // runtime default.
    const resolvedLocale = computed(() => props.locale ?? i18n.value.locale);

    const rangeStart = ref<string | null>(props.rangeStart);
    const rangeEnd = ref<string | null>(props.rangeEnd);
    watch(
      () => props.rangeStart,
      (next) => {
        rangeStart.value = next;
      },
    );
    watch(
      () => props.rangeEnd,
      (next) => {
        rangeEnd.value = next;
      },
    );

    // In range mode each click extends or restarts the range; otherwise it is
    // a single selection. Both reuse the core's day click, which reports the
    // ISO date.
    const handleSelect = (iso: string) => {
      if (props.mode === "range") {
        if (!rangeStart.value || rangeEnd.value) {
          rangeStart.value = iso;
          rangeEnd.value = null;
        } else if (iso < rangeStart.value) {
          rangeEnd.value = rangeStart.value;
          rangeStart.value = iso;
        } else {
          rangeEnd.value = iso;
        }
        props.onRangeChange?.(rangeStart.value, rangeEnd.value);
        return;
      }
      emit("update:modelValue", iso);
      props.onValueChange?.(iso);
    };

    const { api, value, focusedDate, view, weekStartsOn } = useCalendar(() => ({
      value: props.modelValue !== undefined ? props.modelValue : props.value,
      focusedDate: props.focusedDate,
      view: props.view,
      weekStartsOn: props.weekStartsOn,
      min: props.min,
      max: props.max,
      onValueChange: handleSelect,
      onFocusChange: props.onFocusChange,
      onViewChange: props.onViewChange,
    }));

    // Intl formatters, recomputed when the locale changes.
    const dt = (iso: string) => new Date(`${iso}T00:00:00`);
    const titleFmt = computed(() =>
      coreI18n.dateTimeFormat(resolvedLocale.value, { month: "long", year: "numeric" }),
    );
    const rangeFmt = computed(() =>
      coreI18n.dateTimeFormat(resolvedLocale.value, {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    );
    const weekdayShort = computed(() =>
      coreI18n.dateTimeFormat(resolvedLocale.value, { weekday: "short" }),
    );
    const weekdayLong = computed(() =>
      coreI18n.dateTimeFormat(resolvedLocale.value, { weekday: "long" }),
    );
    const weekdayNarrow = computed(() =>
      coreI18n.dateTimeFormat(resolvedLocale.value, { weekday: "narrow" }),
    );
    const dayFmt = computed(() =>
      coreI18n.dateTimeFormat(resolvedLocale.value, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    );
    const yearFmt = computed(() =>
      coreI18n.dateTimeFormat(resolvedLocale.value, { year: "numeric" }),
    );
    const monthFmt = computed(() =>
      coreI18n.dateTimeFormat(resolvedLocale.value, { month: "long" }),
    );

    const reference = computed(() => core.describe(focusedDate.value));
    const order = computed(() => core.weekdayOrder(weekStartsOn.value));
    const isGrid = computed(() => view.value === "month" || view.value === "two-month");

    // The month(s) the grid views show.
    const gridMonths = computed(() => {
      const first = { year: reference.value.year, month: reference.value.month };
      if (view.value !== "two-month") return [first];
      const next = core.describe(core.addMonths(focusedDate.value, 1));
      return [first, { year: next.year, month: next.month }];
    });

    // The consecutive days the agenda views show.
    const agendaDays = computed(() => {
      switch (view.value) {
        case "week":
          return core.weekDays(focusedDate.value, weekStartsOn.value);
        case "three-day":
          return core.rangeDays(focusedDate.value, 3);
        case "day":
          return core.rangeDays(focusedDate.value, 1);
        default:
          return [];
      }
    });

    // Group the events by date for an O(1) per-cell lookup.
    const eventsByDate = computed(() =>
      props.events.reduce<Record<string, CalendarEvent[]>>((acc, event) => {
        (acc[event.date] ??= []).push(event);
        return acc;
      }, {}),
    );

    const switcherItems = computed(() =>
      props.views.map((entry) => ({
        value: entry,
        label: props.viewLabels[entry] ?? i18n.value.t(`calendar.view.${entry}` as MessageKey),
      })),
    );

    const periodTitle = computed(() => {
      const focused = focusedDate.value;
      switch (view.value) {
        case "year":
          return yearFmt.value.format(dt(focused));
        case "day":
          return dayFmt.value.format(dt(focused));
        case "week": {
          const days = core.weekDays(focused, weekStartsOn.value);
          return rangeFmt.value.formatRange(dt(days[0]!.date), dt(days[6]!.date));
        }
        case "three-day": {
          const days = core.rangeDays(focused, 3);
          return rangeFmt.value.formatRange(dt(days[0]!.date), dt(days[2]!.date));
        }
        case "two-month": {
          const start = core.startOfMonth(focused);
          return titleFmt.value.formatRange(dt(start), dt(core.addMonths(start, 1)));
        }
        default:
          return titleFmt.value.format(dt(focused));
      }
    });

    const monthLabel = (month: { year: number; month: number }) =>
      titleFmt.value.format(new Date(Date.UTC(month.year, month.month - 1, 1)));
    const monthName = (month: { year: number; month: number }) =>
      monthFmt.value.format(new Date(Date.UTC(month.year, month.month - 1, 1)));

    const dayAria = (iso: string, count: number, price: string | undefined) => {
      let aria = dayFmt.value.format(dt(iso));
      if (count) aria += `, ${count} ${count === 1 ? "event" : "events"}`;
      if (price) aria += `, ${price}`;
      return aria;
    };

    const gridLabel = () => props.label ?? i18n.value.t("calendar.label");

    const weekdayRow = (className: string, cellClass: string, fmt: Intl.DateTimeFormat) =>
      h(
        "div",
        { class: ["calendar__row", className], role: "row" },
        order.value.map((weekday) =>
          h(
            "span",
            {
              key: weekday,
              class: cellClass,
              role: "columnheader",
              "aria-label": weekdayName(weekdayLong.value, weekday),
            },
            weekdayName(fmt, weekday),
          ),
        ),
      );

    const blankCell = (key: string) =>
      h("div", { key, class: "calendar__cell calendar__cell--blank", "aria-hidden": "true" });

    const dayContent = (
      cell: core.CalendarDay,
      inMonth: boolean,
      dayEvents: CalendarEvent[],
      price: string | undefined,
    ): VNodeChild[] => {
      if (slots.day) {
        return slots.day({
          date: cell.date,
          inMonth,
          selected: value.value === cell.date,
          events: dayEvents,
          price,
        });
      }
      return [
        h("span", { class: "calendar__daynum" }, cell.day),
        dayEvents.length
          ? h("span", { class: "calendar__dots", "aria-hidden": "true" }, [
              ...dayEvents.slice(0, props.maxDots).map((event, index) =>
                h("span", {
                  key: event.label ?? `${event.date}-${index}`,
                  class: "calendar__dot",
                  "data-tone": event.tone ?? "primary",
                  title: event.label,
                }),
              ),
              dayEvents.length > props.maxDots
                ? h("span", { class: "calendar__more" }, `+${dayEvents.length - props.maxDots}`)
                : null,
            ])
          : null,
        price ? h("span", { class: "calendar__price" }, price) : null,
      ];
    };

    const monthBody = () =>
      h(
        "div",
        { class: "calendar__months" },
        gridMonths.value.map((month) => {
          const hideOutside = view.value === "two-month";

          return h("div", { class: "calendar__month", key: `${month.year}-${month.month}` }, [
            hideOutside ? h("h3", { class: "calendar__month-title" }, monthLabel(month)) : null,
            h(
              "div",
              {
                ...api.value.gridProps,
                class: "calendar__grid",
                "aria-label": hideOutside ? monthLabel(month) : gridLabel(),
              },
              [
                weekdayRow("calendar__weekdays", "calendar__weekday", weekdayShort.value),
                ...core
                  .monthMatrix(month.year, month.month, weekStartsOn.value)
                  .map((week, index) => {
                    if (hideOutside && !week.some((cell) => cell.month === month.month))
                      return null;

                    return h(
                      "div",
                      { ...api.value.rowProps, key: index, class: "calendar__row calendar__week" },
                      week.map((cell) => {
                        const inMonth = cell.month === month.month;
                        if (hideOutside && !inMonth) return blankCell(cell.date);

                        const dayEvents = eventsByDate.value[cell.date] ?? [];
                        const price = props.prices[cell.date];
                        const inSpan =
                          props.mode === "range" &&
                          rangeStart.value &&
                          rangeEnd.value &&
                          cell.date > rangeStart.value &&
                          cell.date < rangeEnd.value;

                        return h(
                          "div",
                          {
                            ...api.value.getCellProps(cell.date),
                            key: cell.date,
                            class: "calendar__cell",
                          },
                          [
                            h(
                              "button",
                              {
                                ...api.value.getDayProps(cell.date),
                                class: ["calendar__day", { "calendar__day--outside": !inMonth }],
                                "data-range-start":
                                  props.mode === "range" && cell.date === rangeStart.value
                                    ? ""
                                    : undefined,
                                "data-range-end":
                                  props.mode === "range" && cell.date === rangeEnd.value
                                    ? ""
                                    : undefined,
                                "data-in-range": inSpan ? "" : undefined,
                                "aria-label": dayAria(cell.date, dayEvents.length, price),
                              },
                              dayContent(cell, inMonth, dayEvents, price),
                            ),
                          ],
                        );
                      }),
                    );
                  }),
              ],
            ),
          ]);
        }),
      );

    const yearBody = () =>
      h(
        "div",
        { class: "calendar__year", style: { "--year-cols": String(props.yearColumns) } },
        core.monthsOfYear(reference.value.year).map((month) =>
          h("section", { class: "calendar__mini", key: month.month }, [
            h(
              "button",
              {
                type: "button",
                class: "calendar__mini-title",
                onClick: () => {
                  api.value.setFocus(core.toISO(month.year, month.month, 1));
                  api.value.setView("month");
                },
              },
              monthName(month),
            ),
            h(
              "div",
              {
                ...api.value.gridProps,
                class: "calendar__mini-grid",
                "aria-label": monthName(month),
              },
              [
                weekdayRow(
                  "calendar__mini-weekdays",
                  "calendar__mini-weekday",
                  weekdayNarrow.value,
                ),
                ...core
                  .monthMatrix(month.year, month.month, weekStartsOn.value)
                  .map((week, index) => {
                    if (!week.some((cell) => cell.month === month.month)) return null;

                    return h(
                      "div",
                      {
                        ...api.value.rowProps,
                        key: index,
                        class: "calendar__row calendar__mini-week",
                      },
                      week.map((cell) =>
                        cell.month === month.month
                          ? h(
                              "div",
                              {
                                ...api.value.getCellProps(cell.date),
                                key: cell.date,
                                class: "calendar__cell",
                              },
                              [
                                h(
                                  "button",
                                  {
                                    ...api.value.getDayProps(cell.date),
                                    class: "calendar__mini-day",
                                    "aria-label": dayFmt.value.format(dt(cell.date)),
                                  },
                                  cell.day,
                                ),
                              ],
                            )
                          : blankCell(cell.date),
                      ),
                    );
                  }),
              ],
            ),
          ]),
        ),
      );

    const agendaBody = () =>
      h(
        "div",
        {
          ...api.value.gridProps,
          class: "calendar__agenda",
          "aria-label": gridLabel(),
          "data-cols": agendaDays.value.length,
        },
        [
          h(
            "div",
            { ...api.value.rowProps, class: "calendar__row calendar__agenda-row" },
            agendaDays.value.map((cell) => {
              const dayEvents = eventsByDate.value[cell.date] ?? [];
              const price = props.prices[cell.date];

              return h(
                "div",
                {
                  ...api.value.getCellProps(cell.date),
                  key: cell.date,
                  class: "calendar__cell calendar__agenda-col",
                },
                [
                  h(
                    "button",
                    {
                      ...api.value.getDayProps(cell.date),
                      class: "calendar__agenda-head",
                      "aria-label": dayAria(cell.date, dayEvents.length, price),
                    },
                    [
                      h(
                        "span",
                        { class: "calendar__agenda-weekday" },
                        weekdayName(weekdayShort.value, cell.weekday),
                      ),
                      h("span", { class: "calendar__agenda-num" }, cell.day),
                    ],
                  ),
                  h("ul", { class: "calendar__agenda-events" }, [
                    ...dayEvents.map((event, index) =>
                      h(
                        "li",
                        { key: event.label ?? `${event.date}-${index}`, class: "calendar__event" },
                        [
                          h("span", {
                            class: "calendar__dot",
                            "data-tone": event.tone ?? "primary",
                            "aria-hidden": "true",
                          }),
                          h("span", { class: "calendar__event-label" }, event.label),
                        ],
                      ),
                    ),
                    price ? h("li", { class: "calendar__agenda-price" }, price) : null,
                    !dayEvents.length && !price
                      ? h("li", { class: "calendar__agenda-empty", "aria-hidden": "true" }, "—")
                      : null,
                  ]),
                ],
              );
            }),
          ),
        ],
      );

    return () =>
      h("section", { class: "calendar", "data-view": view.value, "data-mode": props.mode }, [
        h("header", { class: "calendar__header" }, [
          h("h2", { class: "calendar__title", "aria-live": "polite" }, periodTitle.value),
          h("div", { class: "calendar__controls" }, [
            switcherItems.value.length > 1
              ? h(SegmentedControl, {
                  items: switcherItems.value,
                  value: view.value,
                  label: props.viewsLabel ?? i18n.value.t("calendar.viewsLabel"),
                  onValueChange: (next: string) => api.value.setView(next as CalendarView),
                })
              : null,
            h("div", { class: "calendar__nav" }, [
              props.showToday
                ? h(
                    "button",
                    {
                      type: "button",
                      class: "calendar__today",
                      onClick: () => api.value.goToday(),
                    },
                    props.todayLabel ?? i18n.value.t("calendar.today"),
                  )
                : null,
              h(
                "button",
                {
                  type: "button",
                  class: "calendar__arrow",
                  "aria-label": props.prevLabel ?? i18n.value.t("calendar.previous"),
                  onClick: () => api.value.goPrev(),
                },
                [
                  h(
                    Icon,
                    { size: "1.25rem" },
                    { default: () => h("polyline", { points: "15 18 9 12 15 6" }) },
                  ),
                ],
              ),
              h(
                "button",
                {
                  type: "button",
                  class: "calendar__arrow",
                  "aria-label": props.nextLabel ?? i18n.value.t("calendar.next"),
                  onClick: () => api.value.goNext(),
                },
                [
                  h(
                    Icon,
                    { size: "1.25rem" },
                    { default: () => h("polyline", { points: "9 18 15 12 9 6" }) },
                  ),
                ],
              ),
            ]),
          ]),
        ]),
        isGrid.value ? monthBody() : view.value === "year" ? yearBody() : agendaBody(),
      ]);
  },
});
