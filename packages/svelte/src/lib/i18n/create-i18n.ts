import { i18n as core } from "@design-system/core";
import { getContext, onMount, setContext } from "svelte";
import { derived, readable, writable, type Readable } from "svelte/store";
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

const NO_PAGE: core.PageLocale = { locale: null, dir: null };

// The page's `lang` and `dir`, following runtime changes. The server has no
// page, so there it stays empty.
const page = readable(NO_PAGE, (set) => {
  const read = () => set(core.pageLocale());
  read();
  return core.subscribePageLocale(read);
});

/**
 * The i18n of a component with no `LocaleProvider`: English messages, the
 * page's `lang` (else the international default `DEFAULT_LOCALE`) and the
 * page's `dir` (else `ltr`). The component renders its first pass without
 * the page, as the server did, so hydration matches; the page applies once
 * it is mounted. `set` does nothing, so no caller can switch the locale for
 * anyone else.
 */
function pageDefault(): I18n {
  const mounted = writable(false);
  try {
    onMount(() => mounted.set(true));
  } catch {
    /* outside a component: no mount, so the default applies */
  }
  const current = derived([mounted, page], ([$mounted, $page]) => ($mounted ? $page : NO_PAGE));
  const locale = derived(current, ($page) => core.resolveLocale(null, $page.locale));
  const dir = derived(current, ($page): Dir => $page.dir ?? "ltr");
  const t = derived(
    locale,
    ($locale): TranslateFn =>
      (key, vars) =>
        core.translate(en, {}, $locale, key, vars),
  );
  return Object.freeze({ locale, dir, t, set: () => {} });
}

/**
 * Read the active i18n from context, or the page default when there is no
 * `LocaleProvider` ancestor. Call during component initialisation.
 *
 * `getContext` throws on the server when a component is rendered as a root with
 * no context map (e.g. SSR of a component without a `LocaleProvider` parent), so
 * we guard it and fall back to the default, keeping SSR safe.
 */
export function getI18n(): I18n {
  let context: I18n | undefined;
  try {
    context = getContext<I18n>(I18N_KEY);
  } catch {
    /* no context map (bare SSR root) */
  }
  return context ?? pageDefault();
}
