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
  let message: MessageValue = overrides[key] ?? catalog[key] ?? key;

  if (typeof message !== "string") {
    const count = typeof vars?.count === "number" ? vars.count : 0;
    message = selectPlural(message, count, locale);
  }
  return interpolate(message, vars);
}
