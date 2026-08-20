/**
 * The message catalog and its types come from the shared core module: one
 * source of truth for every adapter, so keys, placeholders and plural forms
 * cannot drift between frameworks.
 */
import { i18n as core } from "@design-system/core";

export const en = core.en;
export type MessageKey = core.MessageKey;
/** A count message: CLDR plural categories, `other` required. */
// The empty extension gives the type a local name, so this package's emitted
// declarations do not have to reference the core's internal module path.
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface PluralMessage extends core.PluralMessage {}
/** Consumer overrides: plain strings, or plural objects for count messages. */
export type Messages = Partial<Record<MessageKey, string | PluralMessage>>;
