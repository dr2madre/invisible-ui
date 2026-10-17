import { i18n as core } from "@invisible-ui/core";
import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import type { MessageKey, Messages } from "./messages";

export type Dir = "ltr" | "rtl";
export type TranslateFn = (key: MessageKey, vars?: Record<string, string | number>) => string;

export interface I18nValue {
  /** Resolved BCP-47 locale; drives formatting, plurals, `lang` and direction. */
  locale: string;
  /** Writing direction: explicit when given, otherwise derived from the locale. */
  dir: Dir;
  /** Translator: `t("select.placeholder")`. Falls back to English, then the key. */
  t: TranslateFn;
}

const translator =
  (messages: Messages, locale: string): TranslateFn =>
  (key, vars) =>
    core.translate(core.en, messages, locale, key, vars);

// Empty outside a provider.
const I18nContext = /* @__PURE__ */ createContext<I18nValue | null>(null);

// The page's `dir` and `lang` as one string, so React can compare snapshots.
const readPage = () => {
  const { locale, dir } = core.pageLocale();
  return `${dir ?? ""}|${locale ?? ""}`;
};
// The server has no page. Hydration renders this snapshot too, so the markup
// matches; React then renders again with the page's own.
const readServerPage = () => "|";

/** The page's language and direction, following runtime changes. */
function usePage(): core.PageLocale {
  const page = useSyncExternalStore(core.subscribePageLocale, readPage, readServerPage);
  const split = page.indexOf("|");
  return {
    dir: (page.slice(0, split) as Dir) || null,
    locale: page.slice(split + 1) || null,
  };
}

// The value outside a provider, one per page language, built on first use so
// a bundle that never reads the locale leaves the catalog out.
const fallbacks = new Map<string, I18nValue>();

/**
 * Read the active i18n value. Components call this for their *default* labels;
 * outside a provider it resolves to the built-in English catalog, so the
 * adapter works with no setup. Its locale is then the page's `lang`, else
 * the international default (`core.DEFAULT_LOCALE`); its direction is the
 * page's `dir`, else `ltr`.
 */
export function useI18n(): I18nValue {
  const context = useContext(I18nContext);
  const page = usePage();
  if (context) return context;
  const key = `${page.dir ?? ""}|${page.locale ?? ""}`;
  let value = fallbacks.get(key);
  if (!value) {
    const locale = core.resolveLocale(null, page.locale);
    value = { locale, dir: page.dir ?? "ltr", t: translator({}, locale) };
    fallbacks.set(key, value);
  }
  return value;
}

export interface LocaleProviderProps {
  /**
   * BCP-47 locale tag. Defaults to the locale around the provider: an outer
   * provider's, else the page's `lang`, else the international default.
   */
  locale?: string;
  /** Explicit writing direction; when omitted it derives from the locale. */
  dir?: Dir;
  /** Message overrides, merged over the English catalog. */
  messages?: Messages;
  children?: ReactNode;
}

/**
 * Provides locale, direction and message overrides to the component tree — the
 * React counterpart of the Svelte adapter's `LocaleProvider`. It renders a
 * `<div lang dir>` so assistive technologies use the right language rules and
 * CSS logical properties resolve correctly for RTL. Without an explicit
 * `dir`, the direction follows the locale. For server rendering, pass
 * `locale`: the server cannot read the page, so without it the server and the
 * hydrating browser both use the international default, and the browser
 * switches to the page's `lang` after hydration.
 */
export function LocaleProvider({ locale, dir, messages, children }: LocaleProviderProps) {
  const outer = useContext(I18nContext);
  const page = usePage();
  const around = locale || outer?.locale || page.locale;
  const value = useMemo<I18nValue>(() => {
    const resolved = core.resolveLocale(around);
    return {
      locale: resolved,
      dir: dir ?? core.localeDirection(resolved),
      t: translator(messages ?? {}, resolved),
    };
  }, [around, dir, messages]);

  return (
    <I18nContext.Provider value={value}>
      <div lang={value.locale} dir={value.dir}>
        {children}
      </div>
    </I18nContext.Provider>
  );
}
