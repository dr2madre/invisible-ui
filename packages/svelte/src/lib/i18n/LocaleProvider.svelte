<script lang="ts">
  /**
   * LocaleProvider — sets the i18n context (locale, writing direction, message
   * overrides) for everything inside it, and applies `dir` to a wrapper so the
   * CSS logical properties used throughout flip for RTL. Wrap your app (or a
   * subtree) once; descendant components read their default labels from here.
   *
   * ```svelte
   * <LocaleProvider locale="ar" dir="rtl" messages={{ "calendar.today": "اليوم" }}>
   *   <Calendar />
   * </LocaleProvider>
   * ```
   */
  import { createI18n, setI18nContext, type Dir } from "./create-i18n";
  import type { Messages } from "./messages";

  export let locale = "en";
  export let dir: Dir = "ltr";
  /** Overrides merged over the English catalog. */
  export let messages: Messages = {};
  /** Render without the wrapping element (you manage `dir` yourself). */
  export let inline = false;

  const i18n = createI18n({ locale, dir, messages });
  setI18nContext(i18n);
  const { dir: dirStore } = i18n;

  // Keep the context in sync if the props change at runtime.
  $: i18n.set({ locale, dir, messages });
</script>

{#if inline}
  <slot />
{:else}
  <div class="ds-locale" dir={$dirStore}><slot /></div>
{/if}

<style>
  .ds-locale {
    display: contents;
  }
</style>
