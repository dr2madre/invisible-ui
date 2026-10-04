import { i18n as coreI18n } from "@design-system/core";
import { useRef } from "react";
import { Calendar, type CalendarEvent } from "../calendar/Calendar";
import type { WeekStart } from "../calendar/use-calendar";
import { useI18n } from "../i18n/i18n";
import { asDate, localDate } from "../internal/date";
import { useResettable } from "../internal/form-reset";
import { PickerField } from "../internal/picker-field";

/** The `Intl` date style the field shows the value in. */
export type DateStyle = "full" | "long" | "medium" | "short";

export interface DatePickerProps {
  /** Initial (uncontrolled) or current (controlled) date, ISO `YYYY-MM-DD`, or `null`. */
  value?: string | null;
  /** Earliest selectable date (ISO), inclusive. */
  min?: string;
  /** Latest selectable date (ISO), inclusive. */
  max?: string;
  /** First day of the week, 0 = Sunday to 6. */
  weekStartsOn?: WeekStart;
  /** BCP-47 locale for the field and the calendar. Defaults to the provider's locale. */
  locale?: string;
  /** `Intl` date style for the field. */
  dateStyle?: DateStyle;
  /** Accessible label for the field. Defaults to the catalog's. */
  label?: string;
  /** Placeholder while empty. Defaults to the catalog's. */
  placeholder?: string;
  disabled?: boolean;
  /** Show a clear button when a date is selected. */
  clearable?: boolean;
  /** Appointment dots, forwarded to the calendar. */
  events?: CalendarEvent[];
  /** Per-day price labels, forwarded to the calendar. */
  prices?: Record<string, string>;
  /** Form field name; the ISO date is submitted under it. */
  name?: string;
  /** Called when the user picks or clears a date. */
  onValueChange?: (value: string | null) => void;
}

/**
 * DatePicker: a date field that opens a `Calendar` in a popup. The readonly
 * field is a combobox that opens a dialog popup; a click, Enter, Space or
 * ArrowDown opens it and focus moves to the calendar's focused day, where the
 * WAI-ARIA date grid keys apply. Picking a day fills the field, closes the
 * popup and puts focus back on the field; Escape does the same without a pick.
 *
 * The field shows the date formatted with `Intl` (`dateStyle`); the value is
 * the ISO `YYYY-MM-DD` string, a controllable mirror (ADR 0011). With `name`,
 * a hidden input submits it, and a form reset puts back the current default
 * without reporting (ADR 0012). `min`, `max`, `events` and `prices` are
 * forwarded to the calendar. Themeable via `--ds-date-picker-*` and the
 * calendar's `--ds-calendar-*`.
 */
export function DatePicker({
  value = null,
  min,
  max,
  weekStartsOn = 1,
  locale,
  dateStyle = "medium",
  label,
  placeholder,
  disabled = false,
  clearable = false,
  events,
  prices,
  name,
  onValueChange,
}: DatePickerProps) {
  const i18n = useI18n();
  const { t } = i18n;
  const rootRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useResettable(asDate(value), onValueChange, rootRef);
  const format = coreI18n.dateTimeFormat(locale ?? i18n.locale, { dateStyle });
  const fieldLabel = label ?? t("datePicker.label");

  return (
    <PickerField
      rootRef={rootRef}
      label={fieldLabel}
      placeholder={placeholder ?? t("datePicker.placeholder")}
      clearLabel={t("datePicker.clear")}
      text={current ? format.format(localDate(current)) : ""}
      active={current != null}
      clearable={clearable && current != null}
      disabled={disabled}
      fields={[{ name, value: current }]}
      onClear={() => setCurrent(null)}
    >
      {(done) => (
        <Calendar
          value={current}
          focusedDate={current ?? undefined}
          min={min}
          max={max}
          weekStartsOn={weekStartsOn}
          locale={locale}
          events={events}
          prices={prices}
          label={fieldLabel}
          onValueChange={(iso) => {
            // Closed before the pick is reported (ADR 0011).
            done();
            setCurrent(iso);
          }}
        />
      )}
    </PickerField>
  );
}
