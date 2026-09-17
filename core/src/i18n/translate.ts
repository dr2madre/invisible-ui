/**
 * The shared translator: one interpolation and one plural rule for every
 * adapter, so catalogs cannot drift. Message variables are inserted as plain
 * text; nothing here produces markup.
 */
import { pluralRules } from "./format";

/** A count message: CLDR plural categories, `other` required. */
export interface PluralMessage {
  zero?: string;
  one?: string;
  two?: string;
  few?: string;
  many?: string;
  other: string;
}

export type MessageValue = string | PluralMessage;

export type TranslateVars = Record<string, string | number>;

const interpolate = (message: string, vars?: TranslateVars) =>
  vars
    ? message.replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? `{${name}}`))
    : message;

/**
 * The plural keys the components use, mapped to the legacy single-form keys
 * some consumers already override. An override of a legacy key keeps working;
 * the mapping is deprecated and recorded for the API program.
 */
const LEGACY_PLURAL_OVERRIDES: Record<string, { one: string; other: string }> = {
  "searchDialog.results": { one: "searchDialog.resultOne", other: "searchDialog.resultMany" },
  "rating.stars": { one: "rating.star", other: "rating.stars" },
};

/**
 * Keys that were renamed. A consumer who overrode the old spelling keeps its
 * translation until the deprecation completes; the catalog default comes from
 * the new key, so an untouched consumer sees no difference.
 */
const LEGACY_KEY_ALIASES: Record<string, string> = {
  "sidebar.label": "menu.label",
};

function selectPlural(message: PluralMessage, count: number, locale: string): string {
  const category = pluralRules(locale).select(count) as keyof PluralMessage;
  return message[category] ?? message.other;
}

/**
 * Resolve one message: consumer override first, catalog second, the key last.
 * A plural object selects its category from `vars.count` with the resolved
 * locale; a missing category falls back to `other`. A plain-string override of
 * a plural message applies to every count.
 */
export function translate(
  catalog: Record<string, MessageValue>,
  overrides: Record<string, MessageValue | undefined>,
  locale: string,
  key: string,
  vars?: TranslateVars,
): string {
  let message: MessageValue | undefined = overrides[key];

  // Legacy compatibility: a consumer that overrode the old one/many string
  // keys keeps its translation until the deprecation completes. The legacy
  // pair also wins over a plain-string override of the new key (that is the
  // old two-string pattern); a plural-object override of the new key wins.
  const legacy = LEGACY_PLURAL_OVERRIDES[key];
  if (legacy && typeof vars?.count === "number" && typeof message !== "object") {
    const legacyKey = vars.count === 1 ? legacy.one : legacy.other;
    const legacyOverride = overrides[legacyKey];
    if (typeof legacyOverride === "string" && (message === undefined || legacyKey !== key)) {
      message = legacyOverride;
    }
  }

  // A consumer's override of the former key answers for the new one, and only
  // an override: the old key's catalog entry must not win over the new key's.
  if (message === undefined) {
    const alias = LEGACY_KEY_ALIASES[key];
    if (alias) message = overrides[alias];
  }

  message ??= catalog[key] ?? key;

  if (typeof message !== "string") {
    const count = typeof vars?.count === "number" ? vars.count : 0;
    message = selectPlural(message, count, locale);
  }
  return interpolate(message, vars);
}
