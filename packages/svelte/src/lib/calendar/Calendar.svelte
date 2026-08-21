<script context="module" lang="ts">
  /** An appointment/event on a given day, shown as a coloured dot. */
  export interface CalendarEvent {
    /** ISO `YYYY-MM-DD`. */
    date: string;
    /** Accessible description (announced; also a tooltip via `title`). */
    label?: string;
    /** Semantic tone for the dot. */
    tone?: "primary" | "success" | "warning" | "danger" | "neutral";
  }
</script>

<script lang="ts">
  /**
   * Calendar — the styled, batteries-included calendar (WAI-ARIA date grid).
   * Behaviour, date math and keyboard navigation come from the headless
   * calendar (`@design-system/core`); this layer adds the header (period label,
   * an optional view switcher, prev/next/today) and the bodies for each view.
   *
   * Views: `month`, `two-month` (two months side by side), `week`,
   * `three-day`, `day` (these last three are day-column agendas). Each day can
   * show **appointment dots** (`events`) and a **price** (`prices`), or custom
   * content via the `day` slot
   * (`let:date let:inMonth let:today let:selected let:events let:price`).
   * Colours, radius and sizing are themeable via `--ds-calendar-*`.
   */
  import { createCalendar, type CalendarView, type WeekStart } from "./create-calendar";
  import { calendar as core, i18n } from "@design-system/core";
  import SegmentedControl from "../segmented-control/SegmentedControl.svelte";
  import Icon from "../icon/Icon.svelte";
  import { getI18n } from "../i18n/create-i18n";
  import type { MessageKey } from "../i18n/messages";

  const { t, locale: providerLocale } = getI18n();

  const {
    describe,
    monthMatrix,
    weekdayOrder,
    weekDays,
    rangeDays,
    addMonths,
    startOfMonth,
    monthsOfYear,
    toISO,
  } = core;

  export let value: string | null = null;
  export let focusedDate: string | undefined = undefined;
  export let view: CalendarView = "month";
  export let weekStartsOn: WeekStart = 1;
  export let min: string | undefined = undefined;
  export let max: string | undefined = undefined;
  /** BCP-47 locale for month/weekday names. Defaults to the provider's locale. */
  export let locale: string | undefined = undefined;

  /** Appointment dots, keyed by their `date`. */
  export let events: CalendarEvent[] = [];
  /** Per-day price label, keyed by ISO date (e.g. `{ "2026-06-25": "€120" }`). */
  export let prices: Record<string, string> = {};
  /** Maximum dots rendered before a "+N" overflow marker (grid views). */
  export let maxDots = 3;
  /** Year view: how many mini-months per row. Defaults to 1 (stacked). */
  export let yearColumns = 1;

  /** Views offered in the built-in switcher. With one entry no switcher shows. */
  export let views: CalendarView[] = ["month"];
  /** Override the switcher labels per view. */
  export let viewLabels: Partial<Record<CalendarView, string>> = {};

  export let showToday = true;
  // Labels default to the i18n catalog (overridable per instance or via LocaleProvider).
  export let prevLabel: string | undefined = undefined;
  export let nextLabel: string | undefined = undefined;
  export let todayLabel: string | undefined = undefined;
  export let viewsLabel: string | undefined = undefined;
  /** Accessible name for the grid. */
  export let label: string | undefined = undefined;

  /** Selection mode: a single date, or a start–end `range`. */
  export let mode: "single" | "range" = "single";
  /** Range endpoints (ISO), used when `mode="range"`. */
  export let rangeStart: string | null = null;
  export let rangeEnd: string | null = null;

  export let onValueChange: ((iso: string) => void) | undefined = undefined;
  export let onFocusChange: ((iso: string) => void) | undefined = undefined;
  export let onViewChange: ((view: CalendarView) => void) | undefined = undefined;
  export let onRangeChange: ((start: string | null, end: string | null) => void) | undefined =
    undefined;

  // In range mode each click extends or restarts the range; otherwise it's a
  // single selection. The range rule lives in core so both adapters share it.
  function handleSelect(iso: string) {
    if (mode === "range") {
      const next = core.extendRange({ start: rangeStart, end: rangeEnd }, iso);
      rangeStart = next.start;
      rangeEnd = next.end;
      onRangeChange?.(rangeStart, rangeEnd);
    } else {
      onValueChange?.(iso);
    }
  }

  const calendar = createCalendar({
    value,
    focusedDate,
    view,
    weekStartsOn,
    min,
    max,
    onValueChange: handleSelect,
    onFocusChange,
    onViewChange,
  });
  const { state: calState, api, gridAction, rowAction, cellAction, dayAction } = calendar;

  $: switcherItems = views.map((v) => ({
    value: v,
    label: viewLabels[v] ?? $t(`calendar.view.${v}` as MessageKey),
  }));

  // Intl formatters through the shared cached factories: the explicit prop
  // wins, then the provider's resolved locale; never the runtime default.
  const dt = (iso: string) => new Date(`${iso}T00:00:00`);
  $: resolvedLocale = locale ?? $providerLocale;
  $: titleFmt = i18n.dateTimeFormat(resolvedLocale, { month: "long", year: "numeric" });
  $: rangeFmt = i18n.dateTimeFormat(resolvedLocale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  $: weekdayShort = i18n.dateTimeFormat(resolvedLocale, { weekday: "short" });
  $: weekdayLong = i18n.dateTimeFormat(resolvedLocale, { weekday: "long" });
  $: dayFmt = i18n.dateTimeFormat(resolvedLocale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  // A reference Sunday (2024-01-07) to render weekday names from an index.
  const weekdayName = (fmt: Intl.DateTimeFormat, wd: number) =>
    fmt.format(new Date(Date.UTC(2024, 0, 7 + wd)));

  $: v = $calState.view;
  $: ref = describe($calState.focusedDate);
  $: order = weekdayOrder($calState.weekStartsOn);
  $: isGrid = v === "month" || v === "two-month";

  // The month(s) shown by the grid views.
  $: gridMonths =
    v === "two-month"
      ? [
          { year: ref.year, month: ref.month },
          (() => {
            const n = describe(addMonths($calState.focusedDate, 1));
            return { year: n.year, month: n.month };
          })(),
        ]
      : [{ year: ref.year, month: ref.month }];

  // The consecutive days shown by the agenda views.
  $: agendaDays =
    v === "week"
      ? weekDays($calState.focusedDate, $calState.weekStartsOn)
      : v === "three-day"
        ? rangeDays($calState.focusedDate, 3)
        : v === "day"
          ? rangeDays($calState.focusedDate, 1)
          : [];

  // Group events by date for O(1) per-cell lookup.
  $: eventsByDate = events.reduce<Record<string, CalendarEvent[]>>((acc, ev) => {
    (acc[ev.date] ??= []).push(ev);
    return acc;
  }, {});

  $: yearFmt = i18n.dateTimeFormat(resolvedLocale, { year: "numeric" });
  $: shortMonthFmt = i18n.dateTimeFormat(resolvedLocale, { month: "long" });
  const shortMonthName = (year: number, month: number) =>
    shortMonthFmt.format(new Date(Date.UTC(year, month - 1, 1)));
  // Narrow weekday initials for the simplified mini-months.
  $: weekdayNarrow = i18n.dateTimeFormat(resolvedLocale, { weekday: "narrow" });

  $: periodTitle = (() => {
    const f = $calState.focusedDate;
    if (v === "year") return yearFmt.format(dt(f));
    if (v === "day") return dayFmt.format(dt(f));
    if (v === "week") {
      const days = weekDays(f, $calState.weekStartsOn);
      return rangeFmt.formatRange(dt(days[0]!.date), dt(days[6]!.date));
    }
    if (v === "three-day") {
      const days = rangeDays(f, 3);
      return rangeFmt.formatRange(dt(days[0]!.date), dt(days[2]!.date));
    }
    if (v === "two-month") {
      return titleFmt.formatRange(dt(startOfMonth(f)), dt(addMonths(startOfMonth(f), 1)));
    }
    return titleFmt.format(dt(f));
  })();

  const monthLabel = (gm: { year: number; month: number }) =>
    titleFmt.format(new Date(Date.UTC(gm.year, gm.month - 1, 1)));

  const dayAria = (iso: string, count: number, price: string | undefined) => {
    let aria = dayFmt.format(dt(iso));
    if (count) aria += `, ${count} ${count === 1 ? "event" : "events"}`;
    if (price) aria += `, ${price}`;
    return aria;
  };
</script>

<section class="calendar" data-view={v} data-mode={mode}>
  <header class="calendar__header">
    <h2 class="calendar__title" aria-live="polite">{periodTitle}</h2>
    <div class="calendar__controls">
      {#if switcherItems.length > 1}
        <SegmentedControl
          items={switcherItems}
          value={v}
          label={viewsLabel ?? $t("calendar.viewsLabel")}
          onValueChange={(next) => $api.setView(next as CalendarView)}
        />
      {/if}
      <div class="calendar__nav">
        {#if showToday}
          <button type="button" class="calendar__today" on:click={() => $api.goToday()}>
            {todayLabel ?? $t("calendar.today")}
          </button>
        {/if}
        <button
          type="button"
          class="calendar__arrow"
          aria-label={prevLabel ?? $t("calendar.previous")}
          on:click={() => $api.goPrev()}
        >
          <Icon size="1.25rem"><polyline points="15 18 9 12 15 6" /></Icon>
        </button>
        <button
          type="button"
          class="calendar__arrow"
          aria-label={nextLabel ?? $t("calendar.next")}
          on:click={() => $api.goNext()}
        >
          <Icon size="1.25rem"><polyline points="9 18 15 12 9 6" /></Icon>
        </button>
      </div>
    </div>
  </header>

  {#if isGrid}
    <div class="calendar__months">
      {#each gridMonths as gm (`${gm.year}-${gm.month}`)}
        {@const hideOutside = v === "two-month"}
        <div class="calendar__month">
          {#if v === "two-month"}
            <h3 class="calendar__month-title">{monthLabel(gm)}</h3>
          {/if}
          <!-- role="grid" is declared here as well as applied by the action:
               the rows below are static markup, and a row outside a grid is
               invalid before hydration. -->
          <div
            class="calendar__grid"
            role="grid"
            use:gridAction
            aria-label={v === "two-month" ? monthLabel(gm) : (label ?? $t("calendar.label"))}
          >
            <div class="calendar__row calendar__weekdays" role="row">
              {#each order as wd (wd)}
                <span
                  class="calendar__weekday"
                  role="columnheader"
                  aria-label={weekdayName(weekdayLong, wd)}
                >
                  {weekdayName(weekdayShort, wd)}
                </span>
              {/each}
            </div>

            {#each monthMatrix(gm.year, gm.month, $calState.weekStartsOn) as week, w (w)}
              {#if !hideOutside || week.some((c) => c.month === gm.month)}
                <div class="calendar__row calendar__week" role="row" use:rowAction>
                  {#each week as cell (cell.date)}
                    {@const inMonth = cell.month === gm.month}
                    {#if hideOutside && !inMonth}
                      <div class="calendar__cell calendar__cell--blank" aria-hidden="true"></div>
                    {:else}
                      {@const dayEvents = eventsByDate[cell.date] ?? []}
                      {@const price = prices[cell.date]}
                      {@const inSpan =
                        mode === "range" &&
                        core.isWithinRange({ start: rangeStart, end: rangeEnd }, cell.date)}
                      <div class="calendar__cell" role="gridcell" use:cellAction={cell.date}>
                        <button
                          class="calendar__day"
                          class:calendar__day--outside={!inMonth}
                          use:dayAction={cell.date}
                          data-range-start={mode === "range" && cell.date === rangeStart
                            ? ""
                            : undefined}
                          data-range-end={mode === "range" && cell.date === rangeEnd
                            ? ""
                            : undefined}
                          data-in-range={inSpan ? "" : undefined}
                          aria-label={dayAria(cell.date, dayEvents.length, price)}
                        >
                          <slot
                            name="day"
                            date={cell.date}
                            {inMonth}
                            selected={$calState.value === cell.date}
                            events={dayEvents}
                            {price}
                          >
                            <span class="calendar__daynum">{cell.day}</span>
                            {#if dayEvents.length}
                              <span class="calendar__dots" aria-hidden="true">
                                {#each dayEvents.slice(0, maxDots) as ev (ev.label ?? ev.date)}
                                  <span
                                    class="calendar__dot"
                                    data-tone={ev.tone ?? "primary"}
                                    title={ev.label}
                                  ></span>
                                {/each}
                                {#if dayEvents.length > maxDots}
                                  <span class="calendar__more">+{dayEvents.length - maxDots}</span>
                                {/if}
                              </span>
                            {/if}
                            {#if price}<span class="calendar__price">{price}</span>{/if}
                          </slot>
                        </button>
                      </div>
                    {/if}
                  {/each}
                </div>
              {/if}
            {/each}
          </div>
        </div>
      {/each}
    </div>
  {:else if v === "year"}
    <div class="calendar__year" style="--year-cols: {yearColumns};">
      {#each monthsOfYear(ref.year) as gm (gm.month)}
        <section class="calendar__mini">
          <button
            type="button"
            class="calendar__mini-title"
            on:click={() => {
              $api.setFocus(toISO(gm.year, gm.month, 1));
              $api.setView("month");
            }}
          >
            {shortMonthName(gm.year, gm.month)}
          </button>
          <div
            class="calendar__mini-grid"
            role="grid"
            use:gridAction
            aria-label={shortMonthName(gm.year, gm.month)}
          >
            <div class="calendar__row calendar__mini-weekdays" role="row">
              {#each order as wd (wd)}
                <span
                  class="calendar__mini-weekday"
                  role="columnheader"
                  aria-label={weekdayName(weekdayLong, wd)}
                >
                  {weekdayName(weekdayNarrow, wd)}
                </span>
              {/each}
            </div>
            {#each monthMatrix(gm.year, gm.month, $calState.weekStartsOn) as week, w (w)}
              {#if week.some((c) => c.month === gm.month)}
                <div class="calendar__row calendar__mini-week" role="row" use:rowAction>
                  {#each week as cell (cell.date)}
                    {#if cell.month !== gm.month}
                      <div class="calendar__cell calendar__cell--blank" aria-hidden="true"></div>
                    {:else}
                      <div class="calendar__cell" role="gridcell" use:cellAction={cell.date}>
                        <button
                          class="calendar__mini-day"
                          use:dayAction={cell.date}
                          aria-label={dayFmt.format(dt(cell.date))}
                        >
                          {cell.day}
                        </button>
                      </div>
                    {/if}
                  {/each}
                </div>
              {/if}
            {/each}
          </div>
        </section>
      {/each}
    </div>
  {:else}
    <div
      class="calendar__agenda"
      role="grid"
      use:gridAction
      aria-label={label ?? $t("calendar.label")}
      data-cols={agendaDays.length}
    >
      <div class="calendar__row calendar__agenda-row" role="row" use:rowAction>
        {#each agendaDays as cell (cell.date)}
          {@const dayEvents = eventsByDate[cell.date] ?? []}
          {@const price = prices[cell.date]}
          <div
            class="calendar__cell calendar__agenda-col"
            role="gridcell"
            use:cellAction={cell.date}
          >
            <button
              class="calendar__agenda-head"
              use:dayAction={cell.date}
              aria-label={dayAria(cell.date, dayEvents.length, price)}
            >
              <span class="calendar__agenda-weekday">{weekdayName(weekdayShort, cell.weekday)}</span
              >
              <span class="calendar__agenda-num">{cell.day}</span>
            </button>
            <ul class="calendar__agenda-events">
              {#each dayEvents as ev (ev.label ?? ev.date)}
                <li class="calendar__event">
                  <span class="calendar__dot" data-tone={ev.tone ?? "primary"} aria-hidden="true"
                  ></span>
                  <span class="calendar__event-label">{ev.label}</span>
                </li>
              {/each}
              {#if price}<li class="calendar__agenda-price">{price}</li>{/if}
              {#if !dayEvents.length && !price}
                <li class="calendar__agenda-empty" aria-hidden="true">—</li>
              {/if}
            </ul>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</section>

<style>
  .calendar {
    inline-size: 100%;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    color: var(--ds-color-text, #282420);
  }

  .calendar__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }
  .calendar__title {
    margin: 0;
    font-size: var(--ds-calendar-title-size, 1.125rem);
    font-weight: 600;
    text-transform: capitalize;
  }
  .calendar__controls {
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }
  .calendar__nav {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
  }
  .calendar__today {
    font: inherit;
    padding: 0.35rem 0.75rem;
    margin-inline-end: 0.25rem;
    color: inherit;
    background: var(--ds-color-surface, #e6e0d8);
    border: 1px solid var(--ds-color-control-border, #757067);
    border-radius: var(--ds-radius-control, 0.5rem);
    cursor: pointer;
  }
  .calendar__arrow {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    inline-size: 2rem;
    block-size: 2rem;
    color: inherit;
    background: none;
    border: 1px solid var(--ds-color-control-border, #757067);
    border-radius: var(--ds-radius-control, 0.5rem);
    cursor: pointer;
  }
  .calendar__today:focus-visible,
  .calendar__arrow:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring-shadow);
    outline-offset: 2px;
  }

  .calendar__months {
    display: flex;
    gap: 1.5rem;
    flex-wrap: wrap;
  }
  .calendar__month {
    flex: 1 1 16rem;
    min-inline-size: 15rem;
  }
  .calendar__month-title {
    margin: 0 0 0.5rem;
    font-size: 0.95rem;
    font-weight: 600;
    text-align: center;
    text-transform: capitalize;
  }

  .calendar__row {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: var(--ds-calendar-gap, 0.25rem);
  }
  .calendar__weekdays {
    margin-block-end: 0.25rem;
  }
  .calendar__weekday {
    text-align: center;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--ds-color-text-secondary, #524c44);
    text-transform: uppercase;
    padding-block: 0.25rem;
  }

  .calendar__cell {
    display: flex;
  }
  .calendar__cell--blank {
    visibility: hidden;
  }
  .calendar__day {
    inline-size: 100%;
    min-block-size: var(--ds-calendar-day-size, 3rem);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.15rem;
    padding: 0.3rem;
    font: inherit;
    color: inherit;
    background: var(--ds-calendar-day-bg, transparent);
    border: 1px solid transparent;
    border-radius: var(--ds-calendar-day-radius, var(--ds-radius-control, 0.5rem));
    cursor: pointer;
  }
  .calendar__day:hover {
    background: var(--ds-calendar-day-hover, var(--ds-color-neutral-surface, #f4f2ef));
  }
  .calendar__day:focus-visible {
    outline: none;
    border-color: var(--ds-color-focus-ring, #8e6cd4);
    box-shadow: var(--ds-focus-ring-shadow);
  }
  /* Days from the neighbouring months read as secondary text. The colour
     alone carries that, at 8.5:1 against 17.5:1 for a day in the month; an
     opacity on top used to take it to 3.0:1, under the 4.5:1 AA asks. */
  .calendar__day--outside {
    color: var(--ds-color-text-secondary, #524c44);
  }
  .calendar__day:global([data-today]) .calendar__daynum {
    font-weight: 700;
    color: var(--ds-calendar-today, var(--ds-color-primary, #7a52cc));
  }
  .calendar__day:global([data-selected]) {
    background: var(--ds-calendar-selected-bg, var(--ds-color-primary, #7a52cc));
    color: var(--ds-calendar-selected-text, #fff);
  }
  .calendar__day:global([data-selected]) .calendar__daynum {
    color: inherit;
  }
  .calendar__day:global([data-disabled]) {
    opacity: 0.35;
    cursor: not-allowed;
  }
  /* Range mode: endpoints look selected; days between get a soft band. */
  .calendar__day[data-range-start],
  .calendar__day[data-range-end] {
    background: var(--ds-calendar-selected-bg, var(--ds-color-primary, #7a52cc));
    color: var(--ds-calendar-selected-text, #fff);
  }
  .calendar__day[data-range-start] .calendar__daynum,
  .calendar__day[data-range-end] .calendar__daynum {
    color: inherit;
  }
  .calendar__day[data-in-range] {
    background: var(--ds-calendar-range-band, rgba(37, 99, 235, 0.12));
    border-radius: 0;
  }

  .calendar__daynum {
    font-size: 0.9rem;
    line-height: 1.4;
  }
  .calendar__dots {
    display: inline-flex;
    align-items: center;
    gap: 0.15rem;
    min-block-size: 0.4rem;
  }
  .calendar__dot {
    inline-size: 0.4rem;
    block-size: 0.4rem;
    border-radius: 50%;
    background: var(--ds-calendar-dot, var(--ds-color-primary, #7a52cc));
    flex: none;
  }
  .calendar__dot[data-tone="success"] {
    background: var(--ds-color-success, #3e7523);
  }
  .calendar__dot[data-tone="warning"] {
    background: var(--ds-color-warning, #c96422);
  }
  .calendar__dot[data-tone="danger"] {
    background: var(--ds-color-danger, #be3b50);
  }
  .calendar__dot[data-tone="neutral"] {
    background: var(--ds-color-text-secondary, #524c44);
  }
  .calendar__more {
    font-size: 0.65rem;
    color: var(--ds-color-text-secondary, #524c44);
  }
  .calendar__price {
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--ds-calendar-price, var(--ds-color-success-body-text, #3e7523));
  }
  .calendar__day:global([data-selected]) .calendar__price,
  .calendar__day:global([data-selected]) .calendar__more {
    color: inherit;
  }

  /* ---- Year view (simplified mini-months, stacked) ---- */
  .calendar__year {
    display: grid;
    grid-template-columns: repeat(var(--year-cols, 1), minmax(0, 1fr));
    gap: 1.25rem;
  }
  .calendar__mini {
    min-inline-size: 0;
  }
  .calendar__mini-title {
    display: block;
    inline-size: 100%;
    margin-block-end: 0.4rem;
    padding: 0.2rem 0.4rem;
    font: inherit;
    font-weight: 600;
    text-align: start;
    text-transform: capitalize;
    color: inherit;
    background: none;
    border: 0;
    border-radius: var(--ds-radius-control, 0.5rem);
    cursor: pointer;
  }
  .calendar__mini-title:hover {
    color: var(--ds-color-primary, #7a52cc);
  }
  .calendar__mini-title:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring-shadow);
    outline-offset: 2px;
  }
  .calendar__mini-grid {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
  }
  .calendar__mini-week,
  .calendar__mini-weekdays {
    gap: 0.1rem;
  }
  .calendar__mini-weekday {
    text-align: center;
    font-size: 0.65rem;
    color: var(--ds-color-text-secondary, #524c44);
  }
  .calendar__mini-day {
    inline-size: 100%;
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    font: inherit;
    font-size: 0.72rem;
    color: inherit;
    background: none;
    border: 0;
    border-radius: 50%;
    cursor: pointer;
  }
  .calendar__mini-day:hover {
    background: var(--ds-calendar-day-hover, var(--ds-color-neutral-surface, #f4f2ef));
  }
  .calendar__mini-day:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring-shadow);
    outline-offset: -1px;
  }
  .calendar__mini-day:global([data-today]) {
    color: var(--ds-calendar-today, var(--ds-color-primary, #7a52cc));
    font-weight: 700;
  }
  .calendar__mini-day:global([data-selected]) {
    background: var(--ds-calendar-selected-bg, var(--ds-color-primary, #7a52cc));
    color: var(--ds-calendar-selected-text, #fff);
  }

  /* ---- Agenda views (week / three-day / day) ---- */
  .calendar__agenda-row {
    grid-template-columns: repeat(var(--cols, 7), 1fr);
    gap: var(--ds-calendar-gap, 0.25rem);
    align-items: stretch;
  }
  .calendar__agenda[data-cols="3"] .calendar__agenda-row {
    --cols: 3;
  }
  .calendar__agenda[data-cols="1"] .calendar__agenda-row {
    --cols: 1;
  }
  .calendar__agenda-col {
    flex-direction: column;
    border: 1px solid var(--ds-color-border, #c7c1b7);
    border-radius: var(--ds-radius-surface, 0.75rem);
    overflow: hidden;
  }
  .calendar__agenda-head {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.1rem;
    padding: 0.4rem;
    font: inherit;
    color: inherit;
    background: var(--ds-color-neutral-surface, #f4f2ef);
    border: 0;
    border-block-end: 1px solid var(--ds-color-border, #c7c1b7);
    cursor: pointer;
  }
  .calendar__agenda-head:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring-shadow);
    outline-offset: -2px;
  }
  .calendar__agenda-head:global([data-selected]) {
    background: var(--ds-calendar-selected-bg, var(--ds-color-primary, #7a52cc));
    color: var(--ds-calendar-selected-text, #fff);
  }
  .calendar__agenda-head:global([data-today]) .calendar__agenda-num {
    color: var(--ds-calendar-today, var(--ds-color-primary, #7a52cc));
    font-weight: 700;
  }
  .calendar__agenda-head:global([data-selected]) .calendar__agenda-num {
    color: inherit;
  }
  .calendar__agenda-weekday {
    font-size: 0.7rem;
    text-transform: uppercase;
    color: var(--ds-color-text-secondary, #524c44);
  }
  .calendar__agenda-head:global([data-selected]) .calendar__agenda-weekday {
    color: inherit;
  }
  .calendar__agenda-num {
    font-size: 1.1rem;
    font-weight: 600;
  }
  .calendar__agenda-events {
    list-style: none;
    margin: 0;
    padding: 0.4rem;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    min-block-size: var(--ds-calendar-agenda-min, 6rem);
  }
  .calendar__event {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.8rem;
  }
  .calendar__event-label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .calendar__agenda-price {
    margin-block-start: auto;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--ds-calendar-price, var(--ds-color-success, #3e7523));
  }
  .calendar__agenda-empty {
    color: var(--ds-color-text-secondary, #524c44);
    text-align: center;
  }
</style>
