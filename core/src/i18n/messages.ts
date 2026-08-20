/**
 * Default (English) message catalog for component strings, shared by every
 * adapter. Components read their default labels from here through each
 * adapter's i18n context, so an app can localize them once via LocaleProvider
 * instead of passing a prop to every component. Any label prop a consumer
 * passes still wins over the catalog.
 *
 * Keys are dot-namespaced by component. `{name}` placeholders are interpolated
 * by `t(key, { name })`. A plural message is an object of CLDR categories
 * (`other` required) selected by `t(key, { count })`.
 */
import type { PluralMessage } from "./translate";

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
  "timeField.hour": "Hour",
  "timeField.minute": "Minute",
  "timeField.second": "Second",
  "timeField.dayPeriod": "AM/PM",
  "timeField.empty": "Empty",
  "timeField.invalidFormat": "Enter a time in the expected format.",
  "timeField.outOfRange": "Enter a time within the allowed range.",
  "timeField.secondsRequired": "Enter hours, minutes, and seconds.",
  "timeField.secondsNotAllowed": "Enter hours and minutes only.",
  // Loading
  "loading.label": "Loading…",
  // Alert
  "inlineNotification.close": "Close",
  "inlineNotification.learnMore": "Learn more",
  // Overlays
  "dialog.close": "Close",
  "dialog.trigger": "Open",
  "searchDialog.trigger": "Search…",
  "collapsible.toggle": "Toggle",
  "loginForm.heading": "Sign in",
  // Shared by the dialog family presets (Alert/Confirm/Prompt — ADR 0005).
  "dialog.confirm": "Confirm",
  "dialog.cancel": "Cancel",
  "dialog.dismiss": "OK",
  "sheetDialog.close": "Close",
  // Notification
  "notificationRegion.label": "Notifications",
  // Forms & inputs
  "combobox.placeholder": "Search…",
  "combobox.clear": "Clear",
  "combobox.empty": "No results",
  "searchDialog.title": "Search",
  "searchDialog.label": "Search",
  "searchDialog.placeholder": "Type to search…",
  "searchDialog.empty": "No results found.",
  "searchDialog.resultOne": "1 result available",
  "searchDialog.resultMany": "{count} results available",
  // Plural form used by the components; the two legacy keys above remain
  // supported as consumer overrides.
  "searchDialog.results": {
    one: "1 result available",
    other: "{count} results available",
  },
  "searchDialog.loading": "Searching…",
  "numberField.increment": "Increase {label}",
  "numberField.decrement": "Decrease {label}",
  "numberField.parseError": "Enter a number.",
  "numberField.rangeUnderflow": "Enter a number that is at least {min}.",
  "numberField.rangeOverflow": "Enter a number that is at most {max}.",
  "numberField.stepMismatch": "Enter a multiple of {step}.",
  "select.placeholder": "Select…",
  "switch.on": "ON",
  "switch.off": "OFF",
  "loginForm.submit": "Sign in",
  "loginForm.forgot": "Forgot password?",
  // Navigation
  "pagination.label": "Pagination",
  "pagination.previous": "Go to previous page",
  "pagination.next": "Go to next page",
  "pagination.page": "Go to page {page}",
  "rating.star": "{count} star",
  // Plural form used by the components; the legacy one-form key above remains
  // supported as a consumer override.
  "rating.stars": {
    one: "{count} star",
    other: "{count} stars",
  },
  "pinInput.cell": "Character {index} of {length}",
  "breadcrumb.label": "Breadcrumb",
  "contextMenu.label": "Context menu",
  "menu.label": "Main",
  "stepper.label": "Progress",
  // Read out for a completed step: the checkmark that shows it is decorative.
  "stepper.completed": "Completed",
  "carousel.previous": "Previous slide",
  "carousel.next": "Next slide",
  "carousel.choose": "Choose slide",
  "combobox.show": "Show options",
  "combobox.hide": "Close options",
  // Data
  "table.views": "Views",
  "table.pagination": "Table pages",
  "table.loadMore": "Load more",
  "table.loading": "Loading…",
  "table.columns": "Columns",
  "table.selectRow": "Select {name}",
  "table.selectPage": "Select all visible rows",
  "table.selection": "Selection",
  "table.noResults": "No rows match the current filters",
  "table.clearFilters": "Clear filters",
  // Misc
  "codeBlock.copy": "Copy code",
  "tag.remove": "Remove",
  "multiSelect.selected": "Selected values",
  "multiSelect.remove": "Remove {name}",
  "multiSelect.empty": "No results",
  "multiSelect.placeholder": "Search\u2026",
  // Upload Drop Area — prompt first, the styled action word last, so translations
  // like "Trascina qui i file oppure seleziona" keep a natural order.
  "uploadDropArea.prompt": "Drag & drop files or",
  "uploadDropArea.action": "browse",
} as const;

export type MessageKey = keyof typeof en;
/** Consumer overrides: plain strings, or plural objects for count messages. */
export type Messages = Partial<Record<MessageKey, string | PluralMessage>>;
