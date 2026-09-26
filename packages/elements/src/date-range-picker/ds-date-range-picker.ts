import type { CalendarView, DsCalendar } from "../calendar/ds-calendar";
import { emit, upgradeProperty } from "../internal/base";
import { asDate, dt, PickerField } from "../date-picker/picker-field";

/**
 * `<ds-date-range-picker>` — a field that opens a range `<ds-calendar>` in a
 * popup, as a custom element.
 *
 * It shares the field and popup of `<ds-date-picker>`: a readonly combobox
 * that opens a dialog popup from a click, Enter, Space or ArrowDown, with focus
 * on the calendar's focused day. The first pick sets the start, the next sets
 * the end (the days between are banded), and the popup closes once both are
 * chosen, with focus back on the field. A pick before the start becomes the
 * new start. The field shows the range formatted with `Intl` for the element's
 * locale; the value is two ISO `YYYY-MM-DD` strings. With `start-name` and
 * `end-name`, hidden inputs submit them with the form, and a form reset puts
 * back the last range set from outside.
 *
 * Attributes: `start`, `end` (ISO `YYYY-MM-DD`), `start-name`, `end-name`,
 * `view` (calendar view in the popup, `two-month` by default), `min`, `max`,
 * `week-starts-on` (0 = Sunday to 6), `locale`, `date-style`
 * (full|long|medium|short), `label`, `placeholder`, `clear-label`,
 * `disabled`, `clearable`.
 * Properties: `start`, `end`, `events`, `prices` (forwarded to the calendar),
 * `open` (read only).
 * Emits: `change` (`detail.start`, `detail.end`; `null` for a missing end).
 */
export class DsDateRangePicker extends PickerField {
  static observedAttributes = [
    "start",
    "end",
    "start-name",
    "end-name",
    "view",
    "min",
    "max",
    "week-starts-on",
    "locale",
    "date-style",
    "label",
    "placeholder",
    "clear-label",
    "disabled",
    "clearable",
  ];

  protected readonly messages = {
    label: "dateRangePicker.label",
    placeholder: "dateRangePicker.placeholder",
    clear: "dateRangePicker.clear",
  } as const;
  protected override inputClass = "date-picker__input--range";
  protected override popupClass = "date-picker__popover--wide";

  #start: string | null = null;
  #end: string | null = null;
  /** What a form reset restores: the last range set from outside. */
  #defaultStart: string | null = null;
  #defaultEnd: string | null = null;
  #synced = false;

  override connectedCallback() {
    upgradeProperty(this, "start");
    upgradeProperty(this, "end");
    upgradeProperty(this, "events");
    upgradeProperty(this, "prices");
    super.connectedCallback();
  }

  get start(): string | null {
    return this.#start;
  }
  set start(next: string | null) {
    if (next == null) this.removeAttribute("start");
    else this.setAttribute("start", next);
  }

  get end(): string | null {
    return this.#end;
  }
  set end(next: string | null) {
    if (next == null) this.removeAttribute("end");
    else this.setAttribute("end", next);
  }

  protected syncValue() {
    if (this.#reflecting) return;
    const start = asDate(this.getAttribute("start"));
    const end = asDate(this.getAttribute("end"));
    // Each default follows its attribute, except for an echo of what the
    // control already holds (ADR 0012).
    if (!this.#synced || start !== this.#start) this.#defaultStart = start;
    if (!this.#synced || end !== this.#end) this.#defaultEnd = end;
    this.#synced = true;
    this.#start = start;
    this.#end = end;
  }

  protected hasValue() {
    return this.#start != null || this.#end != null;
  }

  protected displayText(format: Intl.DateTimeFormat) {
    if (this.#start && this.#end) return format.formatRange(dt(this.#start), dt(this.#end));
    if (this.#start) return `${format.format(dt(this.#start))} – …`;
    return "";
  }

  protected formFields() {
    return [
      { name: this.getAttribute("start-name"), value: this.#start ?? "" },
      { name: this.getAttribute("end-name"), value: this.#end ?? "" },
    ];
  }

  protected configureCalendar(calendar: DsCalendar) {
    calendar.setAttribute("mode", "range");
    calendar.setAttribute(
      "view",
      (this.getAttribute("view") as CalendarView | null) ?? "two-month",
    );
    if (this.#start) {
      calendar.setAttribute("range-start", this.#start);
      calendar.setAttribute("focused-date", this.#start);
    }
    if (this.#end) calendar.setAttribute("range-end", this.#end);
  }

  protected onCalendarPick(event: CustomEvent<{ start: string | null; end: string | null }>) {
    const { start, end } = event.detail;
    this.#report(start, end);
    return start != null && end != null;
  }

  protected clearValue() {
    this.#report(null, null);
  }

  protected restore() {
    this.#reflect(this.#defaultStart, this.#defaultEnd);
  }

  #report(start: string | null, end: string | null) {
    // State and attributes before the event, so a page that writes its own
    // range back from the listener has the last word.
    this.#reflect(start, end);
    emit(this, "change", { start, end });
  }

  /** While both attributes follow the state, the first must not be read alone. */
  #reflecting = false;

  #reflect(start: string | null, end: string | null) {
    this.#start = start;
    this.#end = end;
    this.#reflecting = true;
    try {
      this.start = start;
      this.end = end;
    } finally {
      this.#reflecting = false;
    }
  }
}
