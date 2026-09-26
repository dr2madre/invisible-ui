import { i18n, timeField as core } from "@design-system/core";
import {
  applyProps,
  boolAttr,
  emit,
  HTMLElementBase,
  nextId,
  upgradeProperty,
} from "../internal/base";
import { watchFormReset } from "../internal/form-reset";
import { localeScope, localized, onLocaleChange, t } from "../internal/i18n";

export type HourCycle = core.HourCycle;
export type TimeValueError = core.TimeValueError;
type Segment = core.TimeSegmentType;

/**
 * `<ds-time-field>` — the segmented time input (hour : minute [: second]
 * [AM/PM]) as a custom element.
 *
 * Each segment is a `role="spinbutton"` driven by the headless time field
 * (`@design-system/core`): ArrowUp/ArrowDown step with wrapping, ArrowLeft and
 * ArrowRight move between segments, digits type with auto-advance, Backspace
 * clears, A and P set the period, Escape puts back the last finished value.
 * The value is the canonical 24-hour string (`HH:mm` or `HH:mm:ss`), `null`
 * while a segment is empty. The hour cycle follows the locale (the closest
 * `<ds-locale-provider>` or `lang`) unless `hour-cycle` says otherwise; labels
 * come from the message catalog. With `name`, a hidden input submits the value
 * with the form, and a form reset puts back the last value set from outside.
 * A time outside `min`/`max` is reported, never corrected.
 *
 * Attributes: `value` (`HH:mm[:ss]`), `name`, `hour-cycle` (12|24),
 * `with-seconds`, `min`, `max`, `label`, `error` (visible error text),
 * `invalid`, `disabled`.
 * Properties: `value`, `validationError` (read only).
 * Emits: `change` (`detail.value`) on every value change, `commit`
 * (`detail.value`) when editing ends (focus leaves the field, or Enter), and
 * `validation-change` (`detail.error`) when the parsed value's own error
 * changes.
 */
export class DsTimeField extends HTMLElementBase {
  static observedAttributes = [
    "value",
    "name",
    "hour-cycle",
    "with-seconds",
    "min",
    "max",
    "label",
    "error",
    "invalid",
    "disabled",
  ];

  #id = nextId("ds-time-field");
  #errorId = `${this.#id}-error`;
  #parts: core.TimeParts = core.emptyParts();
  #committed: core.TimeParts = this.#parts;
  #validationError: TimeValueError | null = null;
  #invalidSegment: Exclude<Segment, "dayPeriod"> | null = null;
  #buffer = "";
  #bufferSeg: Segment | null = null;
  /** What a form reset restores: the last value set from outside. */
  #defaultValue: string | null = null;
  #layout = "";

  #group: HTMLDivElement | null = null;
  #hidden: HTMLInputElement | null = null;
  #error: HTMLParagraphElement | null = null;
  #segments = new Map<Segment, HTMLSpanElement>();
  #stopFormReset: (() => void) | null = null;

  constructor() {
    super();
    onLocaleChange(this, () => {
      // The locale can change the hour cycle, which reshapes the segments.
      if (this.#group) this.#reparse(this.getAttribute("value"));
      this.#render();
    });
  }

  connectedCallback() {
    upgradeProperty(this, "value");
    if (!this.#group) {
      this.#build();
      this.#defaultValue = this.getAttribute("value");
      this.#reparse(this.#defaultValue);
      this.#committed = this.#parts;
    }
    this.#render();
    this.#stopFormReset ??= watchFormReset(
      this,
      () => this.#hidden,
      () => this.#restore(),
    );
  }

  disconnectedCallback() {
    this.#stopFormReset?.();
    this.#stopFormReset = null;
  }

  attributeChangedCallback(name: string, previous: string | null, next: string | null) {
    if (!this.#group || previous === next) return;
    if (name === "value") {
      // An echo of what the control reported is neither news nor a new
      // default (ADR 0012).
      if (next === this.#current()) return;
      this.#defaultValue = next;
      this.#reparse(next);
    } else if (name === "hour-cycle" || name === "with-seconds") {
      this.#reparse(this.#current() ?? this.getAttribute("value"));
    }
    this.#render();
  }

  get value(): string | null {
    return this.#current();
  }
  set value(next: string | null) {
    if (next == null) this.removeAttribute("value");
    else this.setAttribute("value", next);
  }

  /** The structural or range error of the current value, or `null`. */
  get validationError(): TimeValueError | null {
    return this.#api().validationError;
  }

  get #hourCycle(): HourCycle {
    const raw = this.getAttribute("hour-cycle");
    if (raw === "12" || raw === "24") return Number(raw) as HourCycle;
    return i18n.localeHourCycle(localeScope(this).locale) ?? 24;
  }

  get #withSeconds(): boolean {
    return boolAttr(this, "with-seconds");
  }

  #current(): string | null {
    return core.format(this.#parts, this.#withSeconds, this.#hourCycle);
  }

  #reparse(value: string | null) {
    const parsed = core.parseTimeValue(value, {
      hourCycle: this.#hourCycle,
      withSeconds: this.#withSeconds,
    });
    this.#parts = parsed.parts;
    this.#invalidSegment = parsed.invalidSegment;
    this.#buffer = "";
    this.#bufferSeg = null;
    this.#setValidationError(parsed.error);
  }

  #setValidationError(error: TimeValueError | null) {
    if (error === this.#validationError) return;
    this.#validationError = error;
    if (this.#group) emit(this, "validation-change", { error });
  }

  #bound(name: "min" | "max") {
    const value = this.getAttribute(name);
    return value && core.parseTimeValue(value).status === "valid" ? value : null;
  }

  #api() {
    return core.connect({
      state: {
        parts: this.#parts,
        committedParts: this.#committed,
        hourCycle: this.#hourCycle,
        withSeconds: this.#withSeconds,
        min: this.#bound("min"),
        max: this.#bound("max"),
        validationError: this.#validationError,
        invalidSegment: this.#invalidSegment,
        buffer: this.#buffer,
        bufferSeg: this.#bufferSeg,
        id: this.#id,
      },
      setParts: (parts, buffer, bufferSeg) => {
        const before = this.#current();
        this.#parts = parts;
        this.#invalidSegment = null;
        this.#buffer = buffer;
        this.#bufferSeg = bufferSeg;
        this.#setValidationError(null);
        const after = this.#current();
        this.#render();
        if (after === before) return;
        // The attribute follows before the event, as an echo the sync ignores.
        this.value = after;
        emit(this, "change", { value: after });
      },
      setCommittedParts: (parts) => {
        this.#committed = parts;
      },
      onCommit: (value) => emit(this, "commit", { value }),
      focus: (seg) => this.#segments.get(seg)?.focus(),
      invalid: boolAttr(this, "invalid") || this.hasAttribute("error"),
      disabled: boolAttr(this, "disabled"),
      messages: {
        hour: t(this, "timeField.hour"),
        minute: t(this, "timeField.minute"),
        second: t(this, "timeField.second"),
        dayPeriod: t(this, "timeField.dayPeriod"),
        empty: t(this, "timeField.empty"),
      },
    });
  }

  #build() {
    this.textContent = "";
    const control = document.createElement("div");
    control.className = "time-field-control";

    const group = document.createElement("div");
    group.className = "time-field";
    // Moving between segments is editing; focus leaving the field is the end.
    group.addEventListener("focusout", (event) => {
      const next = event.relatedTarget;
      if (next instanceof Node && group.contains(next)) return;
      this.#api().commit();
    });

    const error = document.createElement("p");
    error.id = this.#errorId;
    error.className = "time-field__error";
    error.setAttribute("aria-live", "polite");

    const hidden = document.createElement("input");
    hidden.type = "hidden";
    group.appendChild(hidden);

    control.append(group, error);
    this.appendChild(control);
    this.#hidden = hidden;
    this.#group = group;
    this.#error = error;
  }

  #messageFor(error: TimeValueError | null): string | undefined {
    switch (error) {
      case "invalid-format":
        return t(this, "timeField.invalidFormat");
      case "out-of-range":
        return t(this, "timeField.outOfRange");
      case "seconds-required":
        return t(this, "timeField.secondsRequired");
      case "seconds-not-allowed":
        return t(this, "timeField.secondsNotAllowed");
      case "range-underflow":
        return t(this, "timeField.rangeUnderflow", { min: this.getAttribute("min") ?? "" });
      case "range-overflow":
        return t(this, "timeField.rangeOverflow", { max: this.getAttribute("max") ?? "" });
      default:
        return undefined;
    }
  }

  #render() {
    const group = this.#group;
    if (!group) return;
    const api = this.#api();
    const disabled = boolAttr(this, "disabled");
    const message = this.getAttribute("error") ?? this.#messageFor(api.validationError);
    const invalid = boolAttr(this, "invalid") || Boolean(message);

    applyProps(group, api.rootProps);
    group.setAttribute("aria-label", localized(this, "label", "timeField.label"));
    applyProps(group, {
      "aria-invalid": invalid || undefined,
      "aria-describedby": message ? this.#errorId : undefined,
    });
    group.classList.toggle("time-field--disabled", disabled);
    group.classList.toggle("time-field--invalid", invalid);

    this.#error!.textContent = message ?? "";
    this.#error!.hidden = !message;

    // Always present: it tells a form reset which form the field is in. Only
    // a named input is submitted.
    const hidden = this.#hidden!;
    const name = this.getAttribute("name");
    if (name) hidden.name = name;
    else hidden.removeAttribute("name");
    hidden.value = api.value ?? "";
    // A disabled control sends nothing, like every native one.
    hidden.disabled = disabled;

    const order = core.segments(this.#hourCycle, this.#withSeconds);
    const layout = order.join(" ");
    if (layout !== this.#layout) this.#buildSegments(order);
    for (const seg of order) {
      const span = this.#segments.get(seg)!;
      const text = api.getSegmentText(seg);
      applyProps(span, api.getSegmentProps(seg));
      const empty =
        seg === "dayPeriod"
          ? this.#parts.dayPeriod == null
          : text === "hh" || text === "mm" || text === "ss";
      span.classList.toggle("time-field__segment--placeholder", empty);
      if (span.textContent !== text) span.textContent = text;
    }
  }

  #buildSegments(order: Segment[]) {
    const group = this.#group!;
    for (const node of Array.from(group.children)) {
      if (node !== this.#hidden) node.remove();
    }
    this.#segments.clear();
    order.forEach((seg, index) => {
      if (index > 0) {
        const separator = document.createElement("span");
        separator.className = "time-field__separator";
        separator.setAttribute("aria-hidden", "true");
        separator.textContent = seg === "dayPeriod" ? " " : ":";
        group.appendChild(separator);
      }
      const span = document.createElement("span");
      span.className = "time-field__segment";
      span.classList.toggle("time-field__segment--period", seg === "dayPeriod");
      group.appendChild(span);
      this.#segments.set(seg, span);
    });
    this.#layout = order.join(" ");
  }

  /** Put the value back to the current default, telling nobody. */
  #restore() {
    const value = this.#defaultValue;
    this.#reparse(value);
    // The finished value moves too, so Escape afterwards keeps the reset.
    this.#committed = this.#parts;
    this.value = value;
    this.#render();
  }
}
