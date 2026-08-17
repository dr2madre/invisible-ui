/**
 * Default (English) message catalog for the Vue adapter's component strings.
 *
 * Mirrors the Svelte and React adapters' catalogs but is scoped to the keys
 * the proof-of-concept components actually read; the adapter grows the catalog
 * alongside its component set. Any label prop a consumer passes still wins
 * over the catalog.
 *
 * Keys are dot-namespaced by component; `{name}` placeholders are interpolated
 * by `t(key, { name })`.
 */
export const en = {
  "breadcrumb.label": "Breadcrumb",
  "calendar.previous": "Previous",
  "carousel.previous": "Previous slide",
  "carousel.next": "Next slide",
  "carousel.choose": "Choose slide",
  "combobox.show": "Show options",
  "combobox.hide": "Close options",
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
  "codeBlock.copy": "Copy code",
  "combobox.placeholder": "Search…",
  "contextMenu.label": "Context menu",
  "datePicker.label": "Date",
  "datePicker.placeholder": "Select a date",
  "datePicker.clear": "Clear date",
  "dateRangePicker.label": "Date range",
  "dateRangePicker.placeholder": "Select a range",
  "dateRangePicker.clear": "Clear range",
  "dialog.close": "Close",
  "dialog.trigger": "Open",
  "searchDialog.trigger": "Search…",
  "collapsible.toggle": "Toggle",
  "loginForm.heading": "Sign in",
  "dialog.confirm": "Confirm",
  "dialog.cancel": "Cancel",
  "dialog.dismiss": "OK",
  "combobox.clear": "Clear",
  "combobox.empty": "No results",
  "inlineNotification.close": "Close",
  "inlineNotification.learnMore": "Learn more",
  "loading.label": "Loading…",
  "loginForm.submit": "Sign in",
  "loginForm.forgot": "Forgot password?",
  "menu.label": "Main",
  "notificationRegion.label": "Notifications",
  "pagination.label": "Pagination",
  "pagination.previous": "Go to previous page",
  "pagination.next": "Go to next page",
  "pagination.page": "Go to page {page}",
  "rating.star": "{count} star",
  "rating.stars": "{count} stars",
  "pinInput.cell": "Character {index} of {length}",
  "searchDialog.title": "Search",
  "searchDialog.label": "Search",
  "searchDialog.placeholder": "Type to search…",
  "searchDialog.empty": "No results found.",
  "searchDialog.resultOne": "1 result available",
  "searchDialog.resultMany": "{count} results available",
  "searchDialog.loading": "Searching…",
  "select.placeholder": "Select…",
  "sheetDialog.close": "Close",
  "stepper.label": "Progress",
  // Read out for a completed step: the checkmark that shows it is decorative.
  "stepper.completed": "Completed",
  "switch.on": "ON",
  "switch.off": "OFF",
  "table.views": "Views",
  "table.pagination": "Table pages",
  "table.loadMore": "Load more",
  "table.loading": "Loading…",
  "table.columns": "Columns",
  "tag.remove": "Remove",
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
  // Upload Drop Area: prompt first, the styled action word last, so
  // translations like "Trascina qui i file oppure seleziona" keep a natural
  // order.
  "uploadDropArea.prompt": "Drag & drop files or",
  "uploadDropArea.action": "browse",
} as const;

export type MessageKey = keyof typeof en;

/** Partial overrides supplied by a `LocaleProvider`. */
export type Messages = Partial<Record<MessageKey, string>>;
