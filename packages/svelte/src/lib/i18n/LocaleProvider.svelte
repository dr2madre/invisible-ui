<script lang="ts">
  /**
   * LocaleProvider — sets the i18n context (locale, writing direction, message
   * overrides) for everything inside it, and applies `lang` and `dir` to a
   * wrapper so assistive technologies use the right language rules and the CSS
   * logical properties used throughout flip for RTL. Without an explicit
   * `dir`, the direction follows the locale. Wrap your app (or a subtree)
   * once; descendant components read their default labels and formatting
   * locale from here.
   *
   * ```svelte
   * <LocaleProvider locale="ar" dir="rtl" messages={{ "calendar.today": "اليوم" }}>
   *   <Calendar />
   * </LocaleProvider>
   * ```
   */
  import { untrack, type Snippet } from "svelte";
  import { createI18n, setI18nContext, type Dir } from "./create-i18n";
  import type { Messages } from "./messages";

  interface Props {
    locale?: string;
    /** Explicit writing direction; when omitted it derives from the locale. */
    dir?: Dir;
    /** Overrides merged over the English catalog. */
    messages?: Messages;
    /** Render without the wrapping element (you manage `dir` yourself). */
    inline?: boolean;
    children?: Snippet;
  }

  let { locale = "en", dir, messages = {}, inline = false, children }: Props = $props();

  // Seeded once from the first props; the effect below follows later ones.
  const i18n = untrack(() => createI18n({ locale, dir, messages }));
  setI18nContext(i18n);
  const { dir: dirStore, locale: localeStore } = i18n;

  // Keep the context in sync if the props change at runtime: the context is a
  // store the descendants read, so the props are pushed into it.
  $effect.pre(() => {
    i18n.set({ locale, dir, messages });
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
