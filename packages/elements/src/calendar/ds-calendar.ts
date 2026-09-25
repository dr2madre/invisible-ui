import { calendar as core, i18n } from "@design-system/core";
import {
  applyProps,
  boolAttr,
  definePart,
  emit,
  HTMLElementBase,
  nextId,
  upgradeProperty,
} from "../internal/base";
import { localeScope, localized, onLocaleChange, t } from "../internal/i18n";
import { stepIcon } from "../internal/icons";
import { DsSegmentedControl } from "../segmented-control/ds-segmented-control";

export type CalendarView = core.CalendarView;
export type WeekStart = core.WeekStart;
export type CalendarMode = "single" | "range";

/** An appointment on a given day, shown as a colored dot. */
export interface CalendarEvent {
  /** ISO `YYYY-MM-DD`. */
  date: string;
  /** Accessible description, also shown as a tooltip. */
  label?: string;
  /** Semantic tone for the dot. */
  tone?: "primary" | "success" | "warning" | "danger" | "neutral";
}

const VIEWS: CalendarView[] = ["month", "two-month", "week", "three-day", "day", "year"];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const asView = (value: string | null, fallback: CalendarView): CalendarView =>
  VIEWS.includes(value as CalendarView) ? (value as CalendarView) : fallback;
const asDate = (value: string | null | undefined) => (value && ISO_DATE.test(value) ? value : null);
/** Midnight local time, so `Intl` shows the same calendar day as the ISO date. */
const dt = (iso: string) => new Date(`${iso}T00:00:00`);
/** A reference Sunday, so a weekday name can be rendered from an index. */
const weekdayName = (fmt: Intl.DateTimeFormat, weekday: number) =>
  fmt.format(new Date(Date.UTC(2024, 0, 7 + weekday)));

/** The first day of the week for a locale, as the core counts it (0 = Sunday). */
export function weekStartFor(locale: string): WeekStart {
  const first = i18n.localeWeekStart(locale);
  return (first == null ? 1 : first % 7) as WeekStart;
}

/**
 * `<ds-calendar>` — the styled calendar (WAI-ARIA date grid) as a custom
 * element.
 *
 * Behaviour, date math and keyboard navigation come from the headless calendar
 * (`@design-system/core`): a roving tab stop on the focused day, arrows move by
 * day and week, Home/End jump to the week edges, PageUp/PageDown step a month
 * (with Shift, a year), Enter/Space select. In right-to-left text the left and
 * right arrows follow the visual direction. This element adds the header
 * (period title, an optional view switcher, previous/next/today) and a body per
 * view: `month`, `two-month`, `week`, `three-day`, `day` and `year`.
 *
 * Month and weekday names come from `Intl` for the element's locale: the
 * `locale` attribute, else the closest `<ds-locale-provider>` or `lang`. The
 * week starts on the locale's first day unless `week-starts-on` says
 * otherwise. Labels come from the message catalog; a label attribute wins.
 *
 * Attributes: `value` (ISO `YYYY-MM-DD`), `focused-date`, `view`, `views`
 * (space-separated list for the switcher), `week-starts-on` (0 = Sunday to 6),
 * `min`, `max`, `locale`, `label`, `prev-label`, `next-label`, `today-label`,
 * `views-label`, `show-today` (`"false"` hides it), `mode` (single|range),
 * `range-start`, `range-end`, `max-dots`, `year-columns`.
 * Properties: `value`, `focusedDate`, `view`, `rangeStart`, `rangeEnd`,
 * `events` (`CalendarEvent[]`), `prices` (ISO date to label), `viewLabels`.
 * Emits: `change` (`detail.value`), `range-change` (`detail.start`,
 * `detail.end`), `focus-change` (`detail.value`), `view-change`
 * (`detail.view`).
 */
export class DsCalendar extends HTMLElementBase {
  static observedAttributes = [
    "value",
    "focused-date",
    "view",
    "views",
    "week-starts-on",
    "min",
    "max",
    "locale",
    "label",
    "prev-label",
    "next-label",
    "today-label",
    "views-label",
    "show-today",
    "mode",
    "range-start",
    "range-end",
    "max-dots",
    "year-columns",
  ];

  #id = nextId("ds-calendar");
  #value: string | null = null;
  #focused = core.today();
  #view: CalendarView = "month";
  #rangeStart: string | null = null;
  #rangeEnd: string | null = null;
  #events: CalendarEvent[] = [];
  #prices: Record<string, string> = {};
  #viewLabels: Partial<Record<CalendarView, string>> = {};

  #root: HTMLElement | null = null;
  #title: HTMLElement | null = null;
  #controls: HTMLElement | null = null;
  #today: HTMLButtonElement | null = null;
  #prev: HTMLButtonElement | null = null;
  #next: HTMLButtonElement | null = null;
  #switcher: DsSegmentedControl | null = null;
  #body: HTMLElement | null = null;
  #arrowsRtl: boolean | null = null;

  constructor() {
    super();
    onLocaleChange(this, () => this.#render());
  }

  connectedCallback() {
    for (const prop of [
      "value",
      "focusedDate",
      "view",
      "rangeStart",
      "rangeEnd",
      "events",
      "prices",
      "viewLabels",
    ]) {
      upgradeProperty(this, prop);
    }
    if (!this.#root) {
      this.#build();
      this.#readAttributes();
    }
    this.#render();
  }

  attributeChangedCallback(name: string, previous: string | null, next: string | null) {
    if (!this.#root || previous === next) return;
    this.#applyAttribute(name, next);
    this.#render();
  }

  get value(): string | null {
    return this.#value;
  }
  set value(next: string | null) {
    if (next == null) this.removeAttribute("value");
    else this.setAttribute("value", next);
  }

  get focusedDate(): string {
    return this.#focused;
  }
  set focusedDate(next: string) {
    this.setAttribute("focused-date", next);
  }

  get view(): CalendarView {
    return this.#view;
  }
  set view(next: CalendarView) {
    this.setAttribute("view", next);
  }

  get rangeStart(): string | null {
    return this.#rangeStart;
  }
  set rangeStart(next: string | null) {
    if (next == null) this.removeAttribute("range-start");
    else this.setAttribute("range-start", next);
  }

  get rangeEnd(): string | null {
    return this.#rangeEnd;
  }
  set rangeEnd(next: string | null) {
    if (next == null) this.removeAttribute("range-end");
    else this.setAttribute("range-end", next);
  }

  get events(): CalendarEvent[] {
    return this.#events;
  }
  set events(next: CalendarEvent[]) {
    this.#events = Array.isArray(next) ? next : [];
    this.#render();
  }

  get prices(): Record<string, string> {
    return this.#prices;
  }
  set prices(next: Record<string, string>) {
    this.#prices = next && typeof next === "object" ? next : {};
    this.#render();
  }

  get viewLabels(): Partial<Record<CalendarView, string>> {
    return this.#viewLabels;
  }
  set viewLabels(next: Partial<Record<CalendarView, string>>) {
    this.#viewLabels = next && typeof next === "object" ? next : {};
    this.#render();
  }

  /** The resolved BCP-47 locale for names and formats. */
  get #locale(): string {
    const tag = this.getAttribute("locale");
    return tag ? i18n.canonicalLocale(tag) : localeScope(this).locale;
  }

  get #weekStartsOn(): WeekStart {
    const raw = this.getAttribute("week-starts-on");
    const n = raw == null || raw === "" ? NaN : Number(raw);
    return Number.isInteger(n) && n >= 0 && n <= 6 ? (n as WeekStart) : weekStartFor(this.#locale);
  }

  get #mode(): CalendarMode {
    return this.getAttribute("mode") === "range" ? "range" : "single";
  }

  get #views(): CalendarView[] {
    const listed = (this.getAttribute("views") ?? "")
      .split(/[\s,]+/)
      .filter((v): v is CalendarView => VIEWS.includes(v as CalendarView));
    return listed.length ? listed : ["month"];
  }

  #readAttributes() {
    this.#value = asDate(this.getAttribute("value"));
    this.#rangeStart = asDate(this.getAttribute("range-start"));
    this.#rangeEnd = asDate(this.getAttribute("range-end"));
    this.#view = asView(this.getAttribute("view"), "month");
    // Without a focused date, focus starts on the selection, then today.
    this.#focused =
      asDate(this.getAttribute("focused-date")) ?? this.#value ?? this.#rangeStart ?? core.today();
  }

  /** Apply one changed attribute; the others keep what the user did since. */
  #applyAttribute(name: string, next: string | null) {
    switch (name) {
      case "value":
        this.#value = asDate(next);
        break;
      case "range-start":
        this.#rangeStart = asDate(next);
        break;
      case "range-end":
        this.#rangeEnd = asDate(next);
        break;
      case "view":
        this.#view = asView(next, this.#view);
        break;
      case "focused-date":
        this.#focused = asDate(next) ?? this.#focused;
        break;
    }
  }

  #api() {
    const min = asDate(this.getAttribute("min"));
    const max = asDate(this.getAttribute("max"));
    return core.connect({
      state: {
        value: this.#mode === "single" ? this.#value : null,
        focusedDate: this.#focused,
        view: this.#view,
        weekStartsOn: this.#weekStartsOn,
        min,
        max,
        id: this.#id,
      },
      setValue: (iso) => this.#select(iso),
      setFocus: (iso) => {
        if (iso === this.#focused) return;
        this.#focused = iso;
        this.#render();
        emit(this, "focus-change", { value: iso });
      },
      setView: (next) => {
        if (next === this.#view) return;
        this.#view = next;
        // State first, then the attribute: the sync that follows sees an echo.
        this.setAttribute("view", next);
        emit(this, "view-change", { view: next });
      },
      focus: (iso) => this.ownerDocument.getElementById(core.dayId(this.#id, iso))?.focus(),
    });
  }

  #select(iso: string) {
    if (this.#mode === "range") {
      const next = core.extendRange({ start: this.#rangeStart, end: this.#rangeEnd }, iso);
      this.#rangeStart = next.start;
      this.#rangeEnd = next.end;
      this.rangeStart = next.start;
      this.rangeEnd = next.end;
      emit(this, "range-change", { start: next.start, end: next.end });
      return;
    }
    if (iso === this.#value) return;
    this.#value = iso;
    // State and attribute before the event, so a page that writes its own
    // value back from the listener has the last word.
    this.setAttribute("value", iso);
    emit(this, "change", { value: iso });
  }

  #build() {
    this.textContent = "";
    const root = document.createElement("section");
    root.className = "calendar";

    const header = document.createElement("header");
    header.className = "calendar__header";
    const title = document.createElement("h2");
    title.className = "calendar__title";
    title.setAttribute("aria-live", "polite");
    const controls = document.createElement("div");
    controls.className = "calendar__controls";
    const nav = document.createElement("div");
    nav.className = "calendar__nav";

    const today = document.createElement("button");
    today.type = "button";
    today.className = "calendar__today";
    today.addEventListener("click", () => this.#api().goToday());
    const prev = document.createElement("button");
    prev.type = "button";
    prev.className = "calendar__arrow";
    prev.addEventListener("click", () => this.#api().goPrev());
    const next = document.createElement("button");
    next.type = "button";
    next.className = "calendar__arrow";
    next.addEventListener("click", () => this.#api().goNext());

    nav.append(today, prev, next);
    controls.append(nav);
    header.append(title, controls);

    // Replaced by the view's body on the first render.
    const body = document.createElement("div");
    // The core counts ArrowRight as the next day. In right-to-left text the
    // next day sits to the left, so the two keys swap before the core sees them.
    root.addEventListener(
      "keydown",
      (event) => {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
        if (!(event.target as Element).matches?.("[data-date]")) return;
        if (getComputedStyle(this).direction !== "rtl") return;
        event.preventDefault();
        event.stopImmediatePropagation();
        const step = event.key === "ArrowLeft" ? 1 : -1;
        this.#api().setFocus(core.addDays(this.#focused, step));
      },
      true,
    );

    root.append(header, body);
    this.appendChild(root);

    this.#root = root;
    this.#title = title;
    this.#controls = controls;
    this.#today = today;
    this.#prev = prev;
    this.#next = next;
    this.#body = body;
  }

  #render() {
    if (!this.#root) return;
    const api = this.#api();
    const locale = this.#locale;
    const root = this.#root;
    root.dataset.view = this.#view;
    root.dataset.mode = this.#mode;

    // Written only on a change, so the live region announces a new period once.
    const title = this.#periodTitle(locale);
    if (this.#title!.textContent !== title) this.#title!.textContent = title;
    this.#syncSwitcher(api);

    this.#today!.hidden = !boolAttr(this, "show-today", true);
    this.#today!.textContent = localized(this, "today-label", "calendar.today");
    this.#prev!.setAttribute("aria-label", localized(this, "prev-label", "calendar.previous"));
    this.#next!.setAttribute("aria-label", localized(this, "next-label", "calendar.next"));
    // The arrows point along the reading direction.
    const rtl = this.isConnected && getComputedStyle(this).direction === "rtl";
    if (this.#arrowsRtl !== rtl) {
      this.#arrowsRtl = rtl;
      this.#prev!.innerHTML = stepIcon(rtl ? "right" : "left");
      this.#next!.innerHTML = stepIcon(rtl ? "left" : "right");
    }

    // A rebuilt body replaces the focused day button; focus follows to the new one.
    const hadFocus = this.#body!.contains(this.ownerDocument.activeElement);
    const isGrid = this.#view === "month" || this.#view === "two-month";
    const body = isGrid
      ? this.#monthBody(api, locale)
      : this.#view === "year"
        ? this.#yearBody(api, locale)
        : this.#agendaBody(api, locale);
    this.#body!.replaceWith(body);
    this.#body = body;
    if (hadFocus) {
      body.querySelector<HTMLElement>(`[data-date="${this.#focused}"]`)?.focus();
    }
  }

  #syncSwitcher(api: core.CalendarApi) {
    const views = this.#views;
    if (views.length < 2) {
      this.#switcher?.remove();
      return;
    }
    if (!this.#switcher) {
      definePart("ds-segmented-control", DsSegmentedControl);
      const switcher = new DsSegmentedControl();
      switcher.addEventListener("change", (event) => {
        // The switcher's own change is not the calendar's.
        event.stopPropagation();
        const next = (event as CustomEvent<{ value: string }>).detail.value;
        this.#api().setView(next as CalendarView);
      });
      this.#switcher = switcher;
    }
    const switcher = this.#switcher;
    switcher.setAttribute("label", localized(this, "views-label", "calendar.viewsLabel"));
    switcher.items = views.map((view) => ({
      value: view,
      label: this.#viewLabels[view] ?? t(this, `calendar.view.${view}` as i18n.MessageKey),
    }));
    switcher.value = api.view;
    if (!switcher.isConnected) this.#controls!.prepend(switcher);
  }

  #periodTitle(locale: string): string {
    const f = this.#focused;
    const weekStart = this.#weekStartsOn;
    const titleFmt = i18n.dateTimeFormat(locale, { month: "long", year: "numeric" });
    const rangeFmt = i18n.dateTimeFormat(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    switch (this.#view) {
      case "year":
        return i18n.dateTimeFormat(locale, { year: "numeric" }).format(dt(f));
      case "day":
        return this.#dayFmt(locale).format(dt(f));
      case "week": {
        const days = core.weekDays(f, weekStart);
        return rangeFmt.formatRange(dt(days[0]!.date), dt(days[6]!.date));
      }
      case "three-day": {
        const days = core.rangeDays(f, 3);
        return rangeFmt.formatRange(dt(days[0]!.date), dt(days[2]!.date));
      }
      case "two-month": {
        const start = core.startOfMonth(f);
        return titleFmt.formatRange(dt(start), dt(core.addMonths(start, 1)));
      }
      default:
        return titleFmt.format(dt(f));
    }
  }

  #dayFmt(locale: string) {
    return i18n.dateTimeFormat(locale, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  #eventsOn(iso: string): CalendarEvent[] {
    return this.#events.filter((event) => event.date === iso);
  }

  #dayLabel(locale: string, iso: string, count: number, price: string | undefined): string {
    let label = this.#dayFmt(locale).format(dt(iso));
    if (count) label += `, ${t(this, "calendar.events", { count })}`;
    if (price) label += `, ${price}`;
    return label;
  }

  #weekdayRow(className: string, cellClass: string, fmt: Intl.DateTimeFormat, locale: string) {
    const long = i18n.dateTimeFormat(locale, { weekday: "long" });
    const row = document.createElement("div");
    row.className = `calendar__row ${className}`;
    row.setAttribute("role", "row");
    for (const weekday of core.weekdayOrder(this.#weekStartsOn)) {
      const cell = document.createElement("span");
      cell.className = cellClass;
      cell.setAttribute("role", "columnheader");
      cell.setAttribute("aria-label", weekdayName(long, weekday));
      cell.textContent = weekdayName(fmt, weekday);
      row.appendChild(cell);
    }
    return row;
  }

  #blankCell() {
    const cell = document.createElement("div");
    cell.className = "calendar__cell calendar__cell--blank";
    cell.setAttribute("aria-hidden", "true");
    return cell;
  }

  #dayCell(api: core.CalendarApi, iso: string, className: string, extra: string[] = []) {
    const cell = document.createElement("div");
    applyProps(cell, api.getCellProps(iso));
    cell.className = ["calendar__cell", ...extra].join(" ");
    const button = document.createElement("button");
    applyProps(button, api.getDayProps(iso));
    button.className = className;
    cell.appendChild(button);
    return { cell, button };
  }

  #dots(dayEvents: CalendarEvent[]) {
    const maxDots = this.#maxDots;
    const dots = document.createElement("span");
    dots.className = "calendar__dots";
    dots.setAttribute("aria-hidden", "true");
    for (const event of dayEvents.slice(0, maxDots)) {
      const dot = document.createElement("span");
      dot.className = "calendar__dot";
      dot.dataset.tone = event.tone ?? "primary";
      if (event.label) dot.title = event.label;
      dots.appendChild(dot);
    }
    if (dayEvents.length > maxDots) {
      const more = document.createElement("span");
      more.className = "calendar__more";
      more.textContent = `+${dayEvents.length - maxDots}`;
      dots.appendChild(more);
    }
    return dots;
  }

  get #maxDots(): number {
    const n = Number(this.getAttribute("max-dots"));
    return this.hasAttribute("max-dots") && Number.isInteger(n) && n >= 0 ? n : 3;
  }

  #monthBody(api: core.CalendarApi, locale: string) {
    const titleFmt = i18n.dateTimeFormat(locale, { month: "long", year: "numeric" });
    const shortFmt = i18n.dateTimeFormat(locale, { weekday: "short" });
    const twoMonth = this.#view === "two-month";
    const ref = core.describe(this.#focused);
    const months = [{ year: ref.year, month: ref.month }];
    if (twoMonth) {
      const next = core.describe(core.addMonths(this.#focused, 1));
      months.push({ year: next.year, month: next.month });
    }
    const range = { start: this.#rangeStart, end: this.#rangeEnd };
    const inRangeMode = this.#mode === "range";

    const wrap = document.createElement("div");
    wrap.className = "calendar__months";
    for (const month of months) {
      const label = titleFmt.format(new Date(Date.UTC(month.year, month.month - 1, 1)));
      const box = document.createElement("div");
      box.className = "calendar__month";
      if (twoMonth) {
        const heading = document.createElement("h3");
        heading.className = "calendar__month-title";
        heading.textContent = label;
        box.appendChild(heading);
      }
      const grid = document.createElement("div");
      applyProps(grid, api.gridProps);
      grid.className = "calendar__grid";
      grid.setAttribute(
        "aria-label",
        twoMonth ? label : localized(this, "label", "calendar.label"),
      );
      grid.appendChild(
        this.#weekdayRow("calendar__weekdays", "calendar__weekday", shortFmt, locale),
      );

      for (const week of core.monthMatrix(month.year, month.month, this.#weekStartsOn)) {
        // Two months side by side show each day once, in its own month.
        if (twoMonth && !week.some((day) => day.month === month.month)) continue;
        const row = document.createElement("div");
        applyProps(row, api.rowProps);
        row.className = "calendar__row calendar__week";
        for (const day of week) {
          const inMonth = day.month === month.month;
          if (twoMonth && !inMonth) {
            row.appendChild(this.#blankCell());
            continue;
          }
          const dayEvents = this.#eventsOn(day.date);
          const price = this.#prices[day.date];
          const { cell, button } = this.#dayCell(api, day.date, "calendar__day");
          button.classList.toggle("calendar__day--outside", !inMonth);
          if (inRangeMode) {
            button.toggleAttribute("data-range-start", day.date === range.start);
            button.toggleAttribute("data-range-end", day.date === range.end);
            button.toggleAttribute("data-in-range", core.isWithinRange(range, day.date));
          }
          button.setAttribute(
            "aria-label",
            this.#dayLabel(locale, day.date, dayEvents.length, price),
          );

          const num = document.createElement("span");
          num.className = "calendar__daynum";
          num.textContent = String(day.day);
          button.appendChild(num);
          if (dayEvents.length) button.appendChild(this.#dots(dayEvents));
          if (price) {
            const tag = document.createElement("span");
            tag.className = "calendar__price";
            tag.textContent = price;
            button.appendChild(tag);
          }
          row.appendChild(cell);
        }
        grid.appendChild(row);
      }
      box.appendChild(grid);
      wrap.appendChild(box);
    }
    return wrap;
  }

  #yearBody(api: core.CalendarApi, locale: string) {
    const monthFmt = i18n.dateTimeFormat(locale, { month: "long" });
    const narrowFmt = i18n.dateTimeFormat(locale, { weekday: "narrow" });
    const dayFmt = this.#dayFmt(locale);
    const columns = Number(this.getAttribute("year-columns"));

    const wrap = document.createElement("div");
    wrap.className = "calendar__year";
    wrap.style.setProperty(
      "--year-cols",
      String(Number.isInteger(columns) && columns > 0 ? columns : 1),
    );
    for (const month of core.monthsOfYear(core.describe(this.#focused).year)) {
      const name = monthFmt.format(new Date(Date.UTC(month.year, month.month - 1, 1)));
      const section = document.createElement("section");
      section.className = "calendar__mini";

      const heading = document.createElement("button");
      heading.type = "button";
      heading.className = "calendar__mini-title";
      heading.textContent = name;
      heading.addEventListener("click", () => {
        const current = this.#api();
        current.setFocus(core.toISO(month.year, month.month, 1));
        this.#api().setView("month");
      });

      const grid = document.createElement("div");
      applyProps(grid, api.gridProps);
      grid.className = "calendar__mini-grid";
      grid.setAttribute("aria-label", name);
      grid.appendChild(
        this.#weekdayRow("calendar__mini-weekdays", "calendar__mini-weekday", narrowFmt, locale),
      );
      for (const week of core.monthMatrix(month.year, month.month, this.#weekStartsOn)) {
        if (!week.some((day) => day.month === month.month)) continue;
        const row = document.createElement("div");
        applyProps(row, api.rowProps);
        row.className = "calendar__row calendar__mini-week";
        for (const day of week) {
          if (day.month !== month.month) {
            row.appendChild(this.#blankCell());
            continue;
          }
          const { cell, button } = this.#dayCell(api, day.date, "calendar__mini-day");
          button.setAttribute("aria-label", dayFmt.format(dt(day.date)));
          button.textContent = String(day.day);
          row.appendChild(cell);
        }
        grid.appendChild(row);
      }
      section.append(heading, grid);
      wrap.appendChild(section);
    }
    return wrap;
  }

  #agendaBody(api: core.CalendarApi, locale: string) {
    const shortFmt = i18n.dateTimeFormat(locale, { weekday: "short" });
    const days =
      this.#view === "week"
        ? core.weekDays(this.#focused, this.#weekStartsOn)
        : core.rangeDays(this.#focused, this.#view === "three-day" ? 3 : 1);

    const grid = document.createElement("div");
    applyProps(grid, api.gridProps);
    grid.className = "calendar__agenda";
    grid.setAttribute("aria-label", localized(this, "label", "calendar.label"));
    grid.dataset.cols = String(days.length);
    const row = document.createElement("div");
    applyProps(row, api.rowProps);
    row.className = "calendar__row calendar__agenda-row";

    for (const day of days) {
      const dayEvents = this.#eventsOn(day.date);
      const price = this.#prices[day.date];
      const { cell, button } = this.#dayCell(api, day.date, "calendar__agenda-head", [
        "calendar__agenda-col",
      ]);
      button.setAttribute("aria-label", this.#dayLabel(locale, day.date, dayEvents.length, price));
      const weekday = document.createElement("span");
      weekday.className = "calendar__agenda-weekday";
      weekday.textContent = weekdayName(shortFmt, day.weekday);
      const num = document.createElement("span");
      num.className = "calendar__agenda-num";
      num.textContent = String(day.day);
      button.append(weekday, num);

      const list = document.createElement("ul");
      list.className = "calendar__agenda-events";
      for (const event of dayEvents) {
        const item = document.createElement("li");
        item.className = "calendar__event";
        const dot = document.createElement("span");
        dot.className = "calendar__dot";
        dot.dataset.tone = event.tone ?? "primary";
        dot.setAttribute("aria-hidden", "true");
        const text = document.createElement("span");
        text.className = "calendar__event-label";
        text.textContent = event.label ?? "";
        item.append(dot, text);
        list.appendChild(item);
      }
      if (price) {
        const item = document.createElement("li");
        item.className = "calendar__agenda-price";
        item.textContent = price;
        list.appendChild(item);
      }
      if (!dayEvents.length && !price) {
        const item = document.createElement("li");
        item.className = "calendar__agenda-empty";
        item.setAttribute("aria-hidden", "true");
        item.textContent = "—";
        list.appendChild(item);
      }
      cell.appendChild(list);
      row.appendChild(cell);
    }
    grid.appendChild(row);
    return grid;
  }
}
