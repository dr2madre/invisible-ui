import { i18n as core } from "@design-system/core";
import { getContext, setContext } from "svelte";
import { derived, writable, type Readable } from "svelte/store";
import { en, type MessageKey, type Messages } from "./messages";

export type Dir = "ltr" | "rtl";
export type TranslateFn = (key: MessageKey, vars?: Record<string, string | number>) => string;

export interface I18n {
  /** Resolved BCP-47 locale; drives formatting, plurals, `lang` and direction. */
  locale: Readable<string>;
  /** Writing direction: explicit when given, otherwise derived from the locale. */
  dir: Readable<Dir>;
  /** Reactive translator: `$t("calendar.today")`. Falls back to English, then the key. */
  t: Readable<TranslateFn>;
  /** Update the locale / dir / message overrides (used by `LocaleProvider`). */
  set: (next: { locale?: string; dir?: Dir; messages?: Messages }) => void;
}

const I18N_KEY = Symbol("ds-i18n");

/** Create an i18n store group from initial locale / dir / message overrides. */
export function createI18n(init: { locale?: string; dir?: Dir; messages?: Messages } = {}): I18n {
  const locale = writable(core.canonicalLocale(init.locale));
  // An explicit direction wins; without one, direction follows the locale.
  const explicitDir = writable<Dir | undefined>(init.dir);
  const messages = writable<Messages>(init.messages ?? {});

  const dir = derived(
    [explicitDir, locale],
    ([$explicit, $locale]) => $explicit ?? core.localeDirection($locale),
  );

  const t = derived(
    [messages, locale],
    ([$messages, $locale]): TranslateFn =>
      (key, vars) =>
        core.translate(en, $messages, $locale, key, vars),
  );

  const set: I18n["set"] = (next) => {
    if (next.locale !== undefined) locale.set(core.canonicalLocale(next.locale));
    if ("dir" in next) explicitDir.set(next.dir);
    if (next.messages !== undefined) messages.set(next.messages);
  };

  return { locale, dir, t, set };
}

/** Put an i18n instance on the context (called by `LocaleProvider`). */
export function setI18nContext(i18n: I18n): void {
  // Guarded for the same reason as getI18n: bare server `render()` of a
  // component with no context map throws. In a real SSR/CSR tree it succeeds.
  try {
    setContext(I18N_KEY, i18n);
  } catch {
    /* no context map (bare SSR root) — components fall back to the default */
  }
}

let fallback: I18n | undefined;

/**
 * Read the active i18n from context, or a shared English default when there is
 * no `LocaleProvider` ancestor. Call during component initialisation.
 *
 * `getContext` throws on the server when a component is rendered as a root with
 * no context map (e.g. SSR of a component without a `LocaleProvider` parent), so
 * we guard it and fall back to the English default — keeping SSR safe.
 */
export function getI18n(): I18n {
  try {
    return getContext<I18n>(I18N_KEY) ?? (fallback ??= createI18n());
  } catch {
    return (fallback ??= createI18n());
  }
}
