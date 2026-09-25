import type { DsCalendar } from "../calendar/ds-calendar";
import { emit, upgradeProperty } from "../internal/base";
import { asDate, dt, PickerField } from "./picker-field";

/**
 * `<ds-date-picker>` — a date field that opens a `<ds-calendar>` in a popup,
 * as a custom element.
 *
 * The readonly field is a combobox that opens a dialog popup. A click, Enter,
 * Space or ArrowDown opens it and focus moves to the calendar's focused day
 * (the WAI-ARIA date grid keys apply there). Picking a day fills the field,
 * closes the popup and puts focus back on the field; Escape does the same
 * without a pick. The field shows the date formatted with `Intl` for the
 * element's locale (`date-style`); the value is the ISO `YYYY-MM-DD` string.
 * With `name`, a hidden input submits it with the form, and a form reset puts
 * back the last value set from outside.
 *
 * Attributes: `value` (ISO `YYYY-MM-DD`), `name`, `min`, `max`,
 * `week-starts-on` (0 = Sunday to 6), `locale`, `date-style`
 * (full|long|medium|short), `label`, `placeholder`, `clear-label`,
 * `disabled`, `clearable`.
 * Properties: `value`, `events`, `prices` (forwarded to the calendar), `open`
 * (read only).
 * Emits: `change` (`detail.value`, `null` when cleared).
 */
export class DsDatePicker extends PickerField {
  static observedAttributes = [
    "value",
    "name",
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
    label: "datePicker.label",
    placeholder: "datePicker.placeholder",
    clear: "datePicker.clear",
  } as const;

  #value: string | null = null;
  /** What a form reset restores: the last value set from outside. */
  #defaultValue: string | null = null;
  #synced = false;

  override connectedCallback() {
    upgradeProperty(this, "value");
    upgradeProperty(this, "events");
    upgradeProperty(this, "prices");
    super.connectedCallback();
  }

  get value(): string | null {
    return this.#value;
  }
  set value(next: string | null) {
    if (next == null) this.removeAttribute("value");
    else this.setAttribute("value", next);
  }

  protected syncValue() {
    const attr = asDate(this.getAttribute("value"));
    // The default a reset restores follows the attribute, except when it only
    // hands back what the control already holds: an echo is not a new
    // default (ADR 0012).
    if (!this.#synced || attr !== this.#value) this.#defaultValue = attr;
    this.#synced = true;
    this.#value = attr;
  }

  protected hasValue() {
    return this.#value != null;
  }

  protected displayText(format: Intl.DateTimeFormat) {
    return this.#value ? format.format(dt(this.#value)) : "";
  }

  protected formFields() {
    return [{ name: this.getAttribute("name"), value: this.#value ?? "" }];
  }

  protected configureCalendar(calendar: DsCalendar) {
    if (this.#value) {
      calendar.setAttribute("value", this.#value);
      calendar.setAttribute("focused-date", this.#value);
    }
  }

  protected onCalendarPick(event: CustomEvent<{ value: string }>) {
    this.#report(event.detail.value);
    return true;
  }

  protected clearValue() {
    this.#report(null);
  }

  protected restore() {
    this.#value = this.#defaultValue;
    this.value = this.#defaultValue;
  }

  #report(next: string | null) {
    // State first, then the attribute: the sync that follows sees an echo.
    // Both before the event, so a page that writes its own value back from
    // the listener has the last word.
    this.#value = next;
    this.value = next;
    emit(this, "change", { value: next });
  }
}
