import { i18n } from "@design-system/core";

/**
 * Locale resolution for the elements. An element reads its locale and message
 * overrides from the closest `<ds-locale-provider>`; without one, from the
 * closest `lang` attribute or the document's, falling back to English. A
 * label attribute the consumer sets still wins over the catalog.
 */

export const LOCALE_PROVIDER_TAG = "ds-locale-provider";

/**
 * Sent, without bubbling, to every `ds-*` element inside a provider whose
 * locale, direction or messages changed: the element renders its labels again.
 */
export const LOCALE_CHANGE_EVENT = "ds-locale-change";

export interface LocaleScope {
  /** Canonical BCP-47 tag. */
  locale: string;
  /** Overrides merged over the English catalog. */
  messages: i18n.Messages;
}

const asMessages = (value: unknown): i18n.Messages =>
  value && typeof value === "object" ? (value as i18n.Messages) : {};

/** The locale and overrides that apply from `start` upwards. */
export function localeScope(start: Element | null): LocaleScope {
  const provider = start?.closest(LOCALE_PROVIDER_TAG);
  if (provider) {
    const tag = provider.getAttribute("locale");
    return {
      // A provider without `locale` takes the language around it.
      locale: tag ? i18n.canonicalLocale(tag) : localeScope(provider.parentElement).locale,
      messages: asMessages((provider as { messages?: unknown }).messages),
    };
  }
  const lang =
    start?.closest("[lang]")?.getAttribute("lang") ??
    (typeof document === "undefined" ? "" : document.documentElement.lang);
  return { locale: i18n.canonicalLocale(lang), messages: {} };
}

/** Translate a catalog key with the locale and overrides that apply to `el`. */
export function t(el: Element, key: i18n.MessageKey, vars?: i18n.TranslateVars): string {
  const { locale, messages } = localeScope(el);
  return i18n.translate(i18n.en, messages, locale, key, vars);
}

/** An explicit label attribute, or the catalog message in its place. */
export function localized(
  el: Element,
  attribute: string,
  key: i18n.MessageKey,
  vars?: i18n.TranslateVars,
): string {
  return el.getAttribute(attribute) ?? t(el, key, vars);
}

/**
 * Render `el`'s labels again when the provider around it changes. The
 * listener sits on the element itself, so it needs no removal.
 */
export function onLocaleChange(el: HTMLElement, render: () => void): void {
  el.addEventListener(LOCALE_CHANGE_EVENT, render);
}

/** Ask every `ds-*` element inside `root` to render its labels again. */
export function notifyLocaleChange(root: Element): void {
  for (const node of Array.from(root.querySelectorAll("*"))) {
    if (node.localName.startsWith("ds-")) node.dispatchEvent(new Event(LOCALE_CHANGE_EVENT));
  }
}
