/**
 * Default (English) message catalog for the React adapter's component strings.
 *
 * Mirrors the Svelte adapter's catalog (`packages/svelte/src/lib/i18n`) but is
 * scoped to the keys the proof-of-concept components actually read — the
 * adapter grows the catalog alongside its component set. Any label prop a
 * consumer passes still wins over the catalog.
 *
 * Keys are dot-namespaced by component; `{name}` placeholders are interpolated
 * by `t(key, { name })`.
 */
export const en = {
  "combobox.placeholder": "Search…",
  "dialog.close": "Close",
  "combobox.clear": "Clear",
  "combobox.empty": "No results",
  "select.placeholder": "Select…",
  "switch.on": "ON",
  "switch.off": "OFF",
} as const;

export type MessageKey = keyof typeof en;

/** Partial overrides supplied by a `LocaleProvider`. */
export type Messages = Partial<Record<MessageKey, string>>;
