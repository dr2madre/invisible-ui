<script lang="ts">
  /**
   * Tooltip — a styled descriptive label shown on hover/focus of a trigger
   * (WAI-ARIA `role="tooltip"` linked via `aria-describedby`). Behaviour comes
   * from the headless tooltip (`@design-system/core`); the adapter adds open/
   * close delays, Floating-UI positioning (flip/shift), and WCAG 1.4.13 "content
   * on hover" semantics (hoverable + Escape-dismissable).
   *
   * The default slot is the trigger (wrap a focusable element); `text` is the
   * tooltip label. For precise control (e.g. putting `aria-describedby` on your
   * own element), use the headless `createTooltip` instead. Themeable via
   * `--ds-tooltip-*`.
   */
  import { createTooltip, type TooltipContext } from "./create-tooltip";
  import { portal } from "../internal/portal";
  import { getI18n } from "../i18n/create-i18n";

  /** Tooltip label text. */
  const { locale: i18nLocale, dir: i18nDir } = getI18n();

  export let text: string;
  export let placement: TooltipContext["placement"] = "top";
  export let openDelay = 300;
  export let closeDelay = 100;

  const tooltip = createTooltip({ placement, openDelay, closeDelay });
  const { triggerAction, tooltipAction, open } = tooltip;
</script>

<span class="tooltip__trigger" use:triggerAction>
  <slot />
</span>

{#if $open}
  <div class="tooltip__content" lang={$i18nLocale} dir={$i18nDir} use:portal use:tooltipAction>
    {text}
  </div>
{/if}

<style>
  .tooltip__trigger {
    display: inline-flex;
  }

  .tooltip__content {
    /* Positioned by the adapter (Floating UI) with a fixed strategy. */
    position: fixed;
    inset-block-start: 0;
    inset-inline-start: 0;
    z-index: var(--ds-tooltip-z-index, 60);
    max-inline-size: var(--ds-tooltip-max-width, 18rem);
    padding: var(--ds-tooltip-padding, 0.3rem 0.5rem);
    font-size: var(--ds-tooltip-font-size, 0.8125rem);
    line-height: var(--ds-line-height, 1.4);
    background: var(--ds-tooltip-bg, var(--ds-color-emphasis-surface, #332f2a));
    color: var(--ds-tooltip-color, var(--ds-color-on-emphasis, #f4f2ef));
    border-radius: var(--ds-tooltip-radius, var(--ds-radius-control, 0.5rem));
    box-shadow: var(
      --ds-elevation-overlay,
      0 10px 15px -3px rgb(0 0 0 / 0.1),
      0 4px 6px -4px rgb(0 0 0 / 0.1)
    );
    pointer-events: auto;
  }
</style>
