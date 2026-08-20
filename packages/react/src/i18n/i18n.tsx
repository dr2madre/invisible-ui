import { i18n as core } from "@design-system/core";
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { en, type MessageKey, type Messages } from "./messages";

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
    core.translate(en, messages, locale, key, vars);

const DEFAULT: I18nValue = {
  locale: core.DEFAULT_LOCALE,
  dir: "ltr",
  t: translator({}, core.DEFAULT_LOCALE),
};

const I18nContext = createContext<I18nValue>(DEFAULT);

/**
 * Read the active i18n value. Components call this for their *default* labels;
 * outside a provider it resolves to the built-in English catalog, so the
 * adapter works with no setup.
 */
export function useI18n(): I18nValue {
  return useContext(I18nContext);
}

export interface LocaleProviderProps {
  /** BCP-47 locale tag. Defaults to `"en"`. */
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
 * `dir`, the direction follows the locale.
 */
export function LocaleProvider({
  locale = core.DEFAULT_LOCALE,
  dir,
  messages,
  children,
}: LocaleProviderProps) {
  const value = useMemo<I18nValue>(() => {
    const resolved = core.canonicalLocale(locale);
    return {
      locale: resolved,
      dir: dir ?? core.localeDirection(resolved),
      t: translator(messages ?? {}, resolved),
    };
  }, [locale, dir, messages]);

  return (
    <I18nContext.Provider value={value}>
      <div lang={value.locale} dir={value.dir}>
        {children}
      </div>
    </I18nContext.Provider>
  );
}
