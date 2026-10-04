import { i18n as coreI18n } from "@design-system/core";
import { useRef } from "react";
import { Calendar, type CalendarEvent } from "../calendar/Calendar";
import type { CalendarView, WeekStart } from "../calendar/use-calendar";
import type { DateStyle } from "../date-picker/DatePicker";
import { useI18n } from "../i18n/i18n";
import { asDate, localDate } from "../internal/date";
import { useResettable } from "../internal/form-reset";
import { PickerField } from "../internal/picker-field";

export interface DateRangePickerProps {
  /** Initial (uncontrolled) or current (controlled) range start, ISO `YYYY-MM-DD`, or `null`. */
  start?: string | null;
  /** Initial (uncontrolled) or current (controlled) range end, ISO `YYYY-MM-DD`, or `null`. */
  end?: string | null;
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
  /** Calendar view inside the popup. Defaults to two months side by side. */
  view?: CalendarView;
  /** Accessible label for the field. Defaults to the catalog's. */
  label?: string;
  /** Placeholder while empty. Defaults to the catalog's. */
  placeholder?: string;
  disabled?: boolean;
  /** Show a clear button when a range is started. */
  clearable?: boolean;
  /** Appointment dots, forwarded to the calendar. */
  events?: CalendarEvent[];
  /** Per-day price labels, forwarded to the calendar. */
  prices?: Record<string, string>;
  /** Form field name for the start date, submitted as an ISO value. */
  startName?: string;
  /** Form field name for the end date, submitted as an ISO value. */
  endName?: string;
  /** Called after each pick and on clear, with a `null` end while the range is half made. */
  onChange?: (start: string | null, end: string | null) => void;
}

/**
 * DateRangePicker: a field that opens a range `Calendar` in a popup. It shares
 * DatePicker's field and popup: the first pick sets the start, the next sets
 * the end (the days between are banded), and the popup closes once both are
 * chosen, with focus back on the field. A pick before the start becomes the
 * new start. The field shows the range formatted with `Intl`; the value is two
 * ISO `YYYY-MM-DD` strings, each a controllable mirror (ADR 0011). With
 * `startName` and `endName`, hidden inputs submit them, and a form reset puts
 * back the current defaults without reporting (ADR 0012). The view defaults
 * to two months. Themeable via `--ds-date-picker-*` and the calendar's
 * `--ds-calendar-*`.
 */
export function DateRangePicker({
  start = null,
  end = null,
  min,
  max,
  weekStartsOn = 1,
  locale,
  dateStyle = "medium",
  view = "two-month",
  label,
  placeholder,
  disabled = false,
  clearable = false,
  events,
  prices,
  startName,
  endName,
  onChange,
}: DateRangePickerProps) {
  const i18n = useI18n();
  const { t } = i18n;
  const rootRef = useRef<HTMLDivElement>(null);
  // Both ends report through one callback, once per action.
  const [from, setFrom] = useResettable(asDate(start), undefined, rootRef);
  const [to, setTo] = useResettable(asDate(end), undefined, rootRef);
  const format = coreI18n.dateTimeFormat(locale ?? i18n.locale, { dateStyle });
  const fieldLabel = label ?? t("dateRangePicker.label");

  const report = (nextStart: string | null, nextEnd: string | null) => {
    setFrom(nextStart);
    setTo(nextEnd);
    onChange?.(nextStart, nextEnd);
  };

  const text =
    from && to
      ? format.formatRange(localDate(from), localDate(to))
      : from
        ? `${format.format(localDate(from))} – …`
        : "";

  return (
    <PickerField
      rootRef={rootRef}
      label={fieldLabel}
      placeholder={placeholder ?? t("dateRangePicker.placeholder")}
      clearLabel={t("dateRangePicker.clear")}
      text={text}
      active={from != null || to != null}
      clearable={clearable && from != null}
      disabled={disabled}
      inputClass="date-picker__input--range"
      popupClass="date-picker__popover--wide"
      fields={[
        { name: startName, value: from },
        { name: endName, value: to },
      ]}
      onClear={() => report(null, null)}
    >
      {(done) => (
        <Calendar
          mode="range"
          rangeStart={from}
          rangeEnd={to}
          focusedDate={from ?? undefined}
          view={view}
          min={min}
          max={max}
          weekStartsOn={weekStartsOn}
          locale={locale}
          events={events}
          prices={prices}
          label={fieldLabel}
          onRangeChange={(nextStart, nextEnd) => {
            // A finished range closes before it is reported (ADR 0011).
            if (nextStart && nextEnd) done();
            report(nextStart, nextEnd);
          }}
        />
      )}
    </PickerField>
  );
}
