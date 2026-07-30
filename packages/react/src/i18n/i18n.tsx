import { createContext, useContext, useMemo, type ReactNode } from "react";
import { en, type MessageKey, type Messages } from "./messages";

export type Dir = "ltr" | "rtl";
export type TranslateFn = (key: MessageKey, vars?: Record<string, string | number>) => string;

export interface I18nValue {
  /** Active BCP-47 locale (informational; date/number formatting uses Intl). */
  locale: string;
  /** Writing direction; mirrored onto the provider's `dir` attribute. */
  dir: Dir;
  /** Translator: `t("select.placeholder")`. Falls back to English, then the key. */
  t: TranslateFn;
}

const interpolate = (str: string, vars?: Record<string, string | number>) =>
  vars ? str.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`)) : str;

const translator =
  (messages: Messages): TranslateFn =>
  (key, vars) =>
    interpolate(messages[key] ?? en[key] ?? key, vars);

const DEFAULT: I18nValue = { locale: "en", dir: "ltr", t: translator({}) };

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
  /** Writing direction. Defaults to `"ltr"`; rendered as a `dir` attribute. */
  dir?: Dir;
  /** Message overrides, merged over the English catalog. */
  messages?: Messages;
  children?: ReactNode;
}

/**
 * Provides locale, direction and message overrides to the component tree — the
 * React counterpart of the Svelte adapter's `LocaleProvider`. It renders a
 * `<div dir>` so CSS logical properties resolve correctly for RTL.
 */
export function LocaleProvider({
  locale = "en",
  dir = "ltr",
  messages,
  children,
}: LocaleProviderProps) {
  const value = useMemo<I18nValue>(
    () => ({ locale, dir, t: translator(messages ?? {}) }),
    [locale, dir, messages],
  );

  return (
    <I18nContext.Provider value={value}>
      <div dir={dir}>{children}</div>
    </I18nContext.Provider>
  );
}
