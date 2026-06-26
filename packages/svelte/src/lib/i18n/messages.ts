/**
 * Default (English) message catalog for component strings. Components read their
 * default labels from here through the i18n context, so an app can localize them
 * once via `LocaleProvider` instead of passing a prop to every component. Any
 * label prop a consumer passes still wins over the catalog.
 *
 * Keys are dot-namespaced by component. `{name}` placeholders are interpolated
 * by `t(key, { name })`.
 */
export const en = {
  // Calendar
  "calendar.previous": "Previous",
  "calendar.next": "Next",
  "calendar.today": "Today",
  "calendar.label": "Calendar",
  "calendar.viewsLabel": "Calendar view",
  "calendar.view.month": "Month",
  "calendar.view.two-month": "2 Months",
  "calendar.view.week": "Week",
  "calendar.view.three-day": "3 Days",
  "calendar.view.day": "Day",
  "calendar.view.year": "Year",
  // Date Picker
  "datePicker.label": "Date",
  "datePicker.placeholder": "Select a date",
  "datePicker.clear": "Clear date",
  // Date Range Picker
  "dateRangePicker.label": "Date range",
  "dateRangePicker.placeholder": "Select a range",
  "dateRangePicker.clear": "Clear range",
  // Time Field
  "timeField.label": "Time",
  "timeField.dayPeriod": "AM/PM",
} as const;

export type MessageKey = keyof typeof en;
export type Messages = Partial<Record<MessageKey, string>>;
