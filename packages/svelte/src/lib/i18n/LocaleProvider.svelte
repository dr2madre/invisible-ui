<script lang="ts">
  /**
   * LocaleProvider — sets the i18n context (locale, writing direction, message
   * overrides) for everything inside it, and applies `lang` and `dir` to a
   * wrapper so assistive technologies use the right language rules and the CSS
   * logical properties used throughout flip for RTL. Without an explicit
   * `dir`, the direction follows the locale. Wrap your app (or a subtree)
   * once; descendant components read their default labels and formatting
   * locale from here. For server rendering, pass `locale`: the server cannot
   * read the page, so without it the server and the hydrating browser both
   * use the international default, and the browser switches to the page's
   * `lang` once mounted.
   *
   * ```svelte
   * <LocaleProvider locale="ar" dir="rtl" messages={{ "calendar.today": "اليوم" }}>
   *   <Calendar />
   * </LocaleProvider>
   * ```
   */
  import { untrack, type Snippet } from "svelte";
  import { createI18n, getI18n, setI18nContext, type Dir } from "./create-i18n";
  import type { Messages } from "./messages";

  interface Props {
    /**
     * BCP-47 locale tag. Defaults to the locale around the provider: an outer
     * provider's, else the page's `lang`, else the international default.
     */
    locale?: string;
    /** Explicit writing direction; when omitted it derives from the locale. */
    dir?: Dir;
    /** Overrides merged over the English catalog. */
    messages?: Messages;
    /** Render without the wrapping element (you manage `dir` yourself). */
    inline?: boolean;
    children?: Snippet;
  }

  let { locale, dir, messages = {}, inline = false, children }: Props = $props();

  // Read before this provider sets its own context: the outer provider, or
  // the page.
  const { locale: outerLocale } = getI18n();
  const around = $derived(locale || $outerLocale);

  // Seeded once from the first props; the effect below follows later ones.
  const i18n = untrack(() => createI18n({ locale: around, dir, messages }));
  setI18nContext(i18n);
  const { dir: dirStore, locale: localeStore } = i18n;

  // Keep the context in sync if the props change at runtime: the context is a
  // store the descendants read, so the props are pushed into it.
  $effect.pre(() => {
    i18n.set({ locale: around, dir, messages });
  });
</script>

{#if inline}
  {@render children?.()}
{:else}
  <div class="ds-locale" lang={$localeStore} dir={$dirStore}>{@render children?.()}</div>
{/if}

<style>
  .ds-locale {
    display: contents;
  }
</style>
