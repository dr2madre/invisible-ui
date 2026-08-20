import {
  computed,
  defineComponent,
  h,
  inject,
  provide,
  type ComputedRef,
  type InjectionKey,
  type PropType,
} from "vue";
import { i18n as core } from "@design-system/core";
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

const DEFAULT: ComputedRef<I18nValue> = computed(() => ({
  locale: core.DEFAULT_LOCALE,
  dir: "ltr",
  t: translator({}, core.DEFAULT_LOCALE),
}));

const I18N: InjectionKey<ComputedRef<I18nValue>> = Symbol("ds-i18n");

/**
 * Read the active i18n value. Components call this for their *default* labels;
 * outside a provider it resolves to the built-in English catalog, so the
 * adapter works with no setup. The value is a computed ref, so renders that
 * read `useI18n().value.t(...)` re-run when the provider's messages change.
 */
export function useI18n(): ComputedRef<I18nValue> {
  return inject(I18N, DEFAULT);
}

export interface LocaleProviderProps {
  /** BCP-47 locale tag. Defaults to `"en"`. */
  locale?: string;
  /** Explicit writing direction; when omitted it derives from the locale. */
  dir?: Dir;
  /** Message overrides, merged over the English catalog. */
  messages?: Messages;
}

/**
 * Provides locale, direction and message overrides to the component tree, the
 * Vue counterpart of the Svelte and React adapters' `LocaleProvider`. It
 * renders a `<div lang dir>` so assistive technologies use the right language
 * rules and CSS logical properties resolve correctly for RTL. Without an
 * explicit `dir`, the direction follows the locale.
 */
export const LocaleProvider = defineComponent({
  name: "LocaleProvider",
  props: {
    locale: { type: String, default: core.DEFAULT_LOCALE },
    dir: { type: String as PropType<Dir>, default: undefined },
    messages: { type: Object as PropType<Messages>, default: undefined },
  },
  setup(props, { slots }) {
    const resolved = computed(() => core.canonicalLocale(props.locale));
    const dir = computed<Dir>(() => props.dir ?? core.localeDirection(resolved.value));
    provide(
      I18N,
      computed<I18nValue>(() => ({
        locale: resolved.value,
        dir: dir.value,
        t: translator(props.messages ?? {}, resolved.value),
      })),
    );

    return () => h("div", { lang: resolved.value, dir: dir.value }, slots.default?.());
  },
});
