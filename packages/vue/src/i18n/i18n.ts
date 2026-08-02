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

const DEFAULT: ComputedRef<I18nValue> = computed(() => ({
  locale: "en",
  dir: "ltr",
  t: translator({}),
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
  /** Writing direction. Defaults to `"ltr"`; rendered as a `dir` attribute. */
  dir?: Dir;
  /** Message overrides, merged over the English catalog. */
  messages?: Messages;
}

/**
 * Provides locale, direction and message overrides to the component tree, the
 * Vue counterpart of the Svelte and React adapters' `LocaleProvider`. It
 * renders a `<div dir>` so CSS logical properties resolve correctly for RTL.
 */
export const LocaleProvider = defineComponent({
  name: "LocaleProvider",
  props: {
    locale: { type: String, default: "en" },
    dir: { type: String as PropType<Dir>, default: "ltr" },
    messages: { type: Object as PropType<Messages>, default: undefined },
  },
  setup(props, { slots }) {
    provide(
      I18N,
      computed<I18nValue>(() => ({
        locale: props.locale,
        dir: props.dir,
        t: translator(props.messages ?? {}),
      })),
    );

    return () => h("div", { dir: props.dir }, slots.default?.());
  },
});
