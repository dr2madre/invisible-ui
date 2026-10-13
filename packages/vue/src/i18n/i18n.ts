import {
  computed,
  defineComponent,
  getCurrentInstance,
  h,
  inject,
  onBeforeUnmount,
  onMounted,
  provide,
  shallowRef,
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

const I18N: InjectionKey<ComputedRef<I18nValue>> = Symbol("ds-i18n");

const NO_PAGE: core.PageLocale = { locale: null, dir: null };

// The page's `lang` and `dir`, read in the browser only, once a component
// has mounted. The server cannot read the page and renders without them.
const page = shallowRef<core.PageLocale>(NO_PAGE);
let stopPage: (() => void) | undefined;
let pageReaders = 0;
const readPage = () => {
  const next = core.pageLocale();
  if (next.locale !== page.value.locale || next.dir !== page.value.dir) page.value = next;
};

/**
 * Whether the calling component has mounted, and the page with it. Every
 * component renders its first pass without the page, as the server did, so
 * hydration matches; the page applies once the component is mounted.
 */
function useMountedPage(): () => core.PageLocale {
  if (!getCurrentInstance()) return () => NO_PAGE;
  const mounted = shallowRef(false);
  onMounted(() => {
    if (pageReaders++ === 0) stopPage = core.subscribePageLocale(readPage);
    readPage();
    mounted.value = true;
  });
  onBeforeUnmount(() => {
    if (--pageReaders === 0) stopPage?.();
  });
  return () => (mounted.value ? page.value : NO_PAGE);
}

// One value per page language and direction, so a component whose page did
// not change keeps the same value and does not render again.
const fallbacks = new Map<string, I18nValue>();
function fallbackFor({ locale: lang, dir }: core.PageLocale): I18nValue {
  const key = `${dir ?? ""}|${lang ?? ""}`;
  let value = fallbacks.get(key);
  if (!value) {
    const locale = core.resolveLocale(null, lang);
    value = { locale, dir: dir ?? "ltr", t: translator({}, locale) };
    fallbacks.set(key, value);
  }
  return value;
}

/**
 * Read the active i18n value. Components call this for their *default* labels;
 * outside a provider it resolves to the built-in English catalog, so the
 * adapter works with no setup. Its locale is then the page's `lang`, else the
 * international default (`DEFAULT_LOCALE`), and its direction the page's
 * `dir`, else `ltr`. The value is a computed ref, so renders that read
 * `useI18n().value.t(...)` re-run when the provider's messages change.
 */
export function useI18n(): ComputedRef<I18nValue> {
  const provided = inject(I18N, null);
  if (provided) return provided;
  const read = useMountedPage();
  return computed(() => fallbackFor(read()));
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
}

/**
 * Provides locale, direction and message overrides to the component tree, the
 * Vue counterpart of the Svelte and React adapters' `LocaleProvider`. It
 * renders a `<div lang dir>` so assistive technologies use the right language
 * rules and CSS logical properties resolve correctly for RTL. Without an
 * explicit `dir`, the direction follows the locale. For server rendering,
 * pass `locale`: the server cannot read the page, so without it the server
 * and the hydrating browser both use the international default, and the
 * browser switches to the page's `lang` once mounted.
 */
export const LocaleProvider = defineComponent({
  name: "LocaleProvider",
  props: {
    locale: { type: String, default: undefined },
    dir: { type: String as PropType<Dir>, default: undefined },
    messages: { type: Object as PropType<Messages>, default: undefined },
  },
  setup(props, { slots }) {
    const outer = inject(I18N, null);
    const read = outer ? undefined : useMountedPage();
    const resolved = computed(() =>
      core.resolveLocale(props.locale || outer?.value.locale || read?.().locale),
    );
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
