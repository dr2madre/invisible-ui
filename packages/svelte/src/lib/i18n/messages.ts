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
  // Loading
  "loading.label": "Loading…",
  // Alert
  "alert.close": "Close",
  "alert.learnMore": "Learn more",
  // Overlays
  "dialog.close": "Close",
  // Shared by the dialog family presets (Alert/Confirm/Prompt — ADR 0005).
  "dialog.confirm": "Confirm",
  "dialog.cancel": "Cancel",
  "dialog.dismiss": "OK",
  "sheet.close": "Close",
  "drawer.close": "Close",
  // Notice
  "noticeRegion.label": "Notices",
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
  "select.placeholder": "Select…",
  "switch.on": "ON",
  "switch.off": "OFF",
  "loginForm.submit": "Sign in",
  "loginForm.forgot": "Forgot password?",
  // Navigation
  "pagination.label": "Pagination",
  "breadcrumb.label": "Breadcrumb",
  "contextMenu.label": "Context menu",
  "menu.label": "Main",
  "stepper.label": "Progress",
  "carousel.previous": "Previous slide",
  "carousel.next": "Next slide",
  // Data
  "table.views": "Views",
  "table.pagination": "Table pages",
  "table.loadMore": "Load more",
  "table.loading": "Loading…",
  "table.columns": "Columns",
  // Misc
  "codeBlock.copy": "Copy code",
  "tag.remove": "Remove",
  // Drop Zone — prompt first, the styled action word last, so translations
  // like "Trascina qui i file oppure seleziona" keep a natural order.
  "dropZone.prompt": "Drag & drop files or",
  "dropZone.action": "browse",
} as const;

export type MessageKey = keyof typeof en;
export type Messages = Partial<Record<MessageKey, string>>;
