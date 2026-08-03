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
  "combobox.placeholder": "Search…",
  "dialog.close": "Close",
  "dialog.confirm": "Confirm",
  "dialog.cancel": "Cancel",
  "dialog.dismiss": "OK",
  "combobox.clear": "Clear",
  "combobox.empty": "No results",
  "inlineNotification.close": "Close",
  "inlineNotification.learnMore": "Learn more",
  "loading.label": "Loading…",
  "notificationRegion.label": "Notifications",
  "pagination.label": "Pagination",
  "select.placeholder": "Select…",
  "switch.on": "ON",
  "switch.off": "OFF",
  "tag.remove": "Remove",
} as const;

export type MessageKey = keyof typeof en;

/** Partial overrides supplied by a `LocaleProvider`. */
export type Messages = Partial<Record<MessageKey, string>>;
