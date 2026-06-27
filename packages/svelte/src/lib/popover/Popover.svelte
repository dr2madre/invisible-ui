<script lang="ts">
  /**
   * Popover — a styled, non-modal floating panel anchored to a trigger button.
   * Behaviour and accessibility (open/close, `aria-haspopup`/`aria-expanded`
   * wiring, Escape to close) come from the headless popover
   * (`@design-system/core`); this adapter adds Floating-UI positioning
   * (flip/shift), outside-press + focus-leave dismissal, and focus management
   * (focus moves into the panel on open, returns to the trigger on Escape).
   *
   * Slots: `trigger` (the trigger's content) and the default slot (the panel
   * content). Colors, radius and elevation are themeable via `--ds-popover-*`.
   */
  import { createPopover, type PopoverContext } from "./create-popover";
  import Button from "../button/Button.svelte";

  /** Visual variant for the trigger Button. */
  export let triggerVariant: "default" | "primary" | "secondary" | "ghost" | "danger" = "default";
  /** Initial open state. */
  export let open = false;
  /** Preferred placement of the panel. */
  export let placement: PopoverContext["placement"] = "bottom";
  /** Called whenever the open state changes. */
  export let onOpenChange: ((open: boolean) => void) | undefined = undefined;

  const popover = createPopover({ open, placement, onOpenChange });
  const { triggerAction, contentAction, open: isOpen } = popover;
</script>

<Button variant={triggerVariant} action={triggerAction}>
  <slot name="trigger">Open</slot>
</Button>

{#if $isOpen}
  <div class="popover__content" use:contentAction>
    <slot />
  </div>
{/if}

<style>
  .popover__content {
    /* Positioned by the adapter (Floating UI) with a fixed strategy. */
    position: fixed;
    inset-block-start: 0;
    inset-inline-start: 0;
    z-index: var(--ds-popover-z-index, 100);
    box-sizing: border-box;
    inline-size: max-content;
    max-inline-size: var(--ds-popover-max-width, 20rem);
    padding: var(--ds-popover-padding, 0.875rem 1rem);
    background: var(--ds-color-background, #fff);
    color: var(--ds-color-text, #0f172a);
    border: 1px solid var(--ds-color-border, #cbd5e1);
    border-radius: var(--ds-popover-radius, var(--ds-radius-surface, 0.75rem));
    box-shadow: var(
      --ds-elevation-overlay,
      0 10px 15px -3px rgb(0 0 0 / 0.1),
      0 4px 6px -4px rgb(0 0 0 / 0.1)
    );
  }
  /* Quieter focus: keep the elevation, tint the border and lay a thin ring just
     inside it — rather than wrapping the whole card in a thick outer ring. */
  .popover__content:focus-visible {
    outline: none;
    border-color: var(--ds-color-focus-ring, #7b52cc);
    box-shadow:
      inset 0 0 0 1px var(--ds-color-focus-ring, #7b52cc),
      var(
        --ds-elevation-overlay,
        0 10px 15px -3px rgb(0 0 0 / 0.1),
        0 4px 6px -4px rgb(0 0 0 / 0.1)
      );
  }
</style>
