<script lang="ts">
  /**
   * HoverCard — a styled, non-modal card revealed on hover/focus of a trigger
   * (typically a link). Behaviour comes from the headless hover card
   * (`@design-system/core`); the adapter adds open/close delays, opening on hover
   * **and** keyboard focus, Floating-UI positioning (flip/shift), hoverable
   * content, close-on-focus-leave and Escape dismissal. Focus is never moved into
   * the card — its links are reached by Tab.
   *
   * Slots: `trigger` (wrap a focusable element, e.g. a link) and the default slot
   * (the card content). It is supplementary content — don't put essential
   * information only in here. Themeable via `--ds-hover-card-*`.
   */
  import { createHoverCard, type HoverCardContext } from "./create-hover-card";

  export let placement: HoverCardContext["placement"] = "bottom";
  export let openDelay = 300;
  export let closeDelay = 200;
  export let onOpenChange: ((open: boolean) => void) | undefined = undefined;

  const hoverCard = createHoverCard({ placement, openDelay, closeDelay, onOpenChange });
  const { triggerAction, contentAction, open } = hoverCard;
</script>

<span class="hover-card__trigger" use:triggerAction>
  <slot name="trigger" />
</span>

{#if $open}
  <div class="hover-card__content" use:contentAction>
    <slot />
  </div>
{/if}

<style>
  .hover-card__trigger {
    display: inline-flex;
  }

  .hover-card__content {
    /* Positioned by the adapter (Floating UI) with a fixed strategy. */
    position: fixed;
    inset-block-start: 0;
    inset-inline-start: 0;
    z-index: var(--ds-hover-card-z-index, 50);
    box-sizing: border-box;
    inline-size: max-content;
    max-inline-size: var(--ds-hover-card-max-width, 20rem);
    padding: var(--ds-hover-card-padding, 1rem);
    background: var(--ds-color-background, #fff);
    color: var(--ds-color-text, #0f172a);
    border: 1px solid var(--ds-color-border, #cbd5e1);
    border-radius: var(--ds-hover-card-radius, var(--ds-radius-surface, 0.75rem));
    box-shadow: var(
      --ds-elevation-overlay,
      0 10px 15px -3px rgb(0 0 0 / 0.1),
      0 4px 6px -4px rgb(0 0 0 / 0.1)
    );
  }
</style>
