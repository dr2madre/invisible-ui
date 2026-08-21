<script lang="ts">
  /**
   * Popover — a styled, non-modal floating card anchored to a trigger. Two
   * opening contracts, one component:
   *
   * - **`trigger="click"`** (default): a Button opens it intentionally.
   *   Behaviour and accessibility (open/close, `aria-haspopup`/`aria-expanded`
   *   wiring, Escape to close) come from the headless popover
   *   (`@design-system/core`); the adapter adds Floating-UI positioning
   *   (flip/shift), outside-press + focus-leave dismissal, and focus management
   *   (focus moves into the panel on open, returns to the trigger on Escape).
   * - **`trigger="hover"`** (the pattern formerly shipped as HoverCard): the
   *   card previews on hover **and keyboard focus** of the slotted trigger
   *   (typically a link), with open/close delays; focus never moves into the
   *   card, and the card holds nothing focusable. The first click/tap opens the
   *   preview instead of activating the trigger; once open, the default action
   *   (e.g. link navigation) proceeds — so touch users get the popover
   *   contract. Hover content must be **supplementary**: never put essential
   *   information only in here. Interactive content belongs to
   *   `trigger="click"`.
   *
   * Slots: `trigger` (button content, or the focusable element itself in hover
   * mode) and the default slot (the card). Themeable via `--ds-popover-*`.
   */
  import { createPopover, type PopoverContext } from "./create-popover";
  import { portal } from "../internal/portal";
  import { createHoverCard } from "../hover-card/create-hover-card";
  import Button from "../button/Button.svelte";
  import { getI18n } from "../i18n/create-i18n";

  const { t } = getI18n();

  /** Opening contract: an intentional click, or a hover/focus preview. */
  export let trigger: "click" | "hover" = "click";
  /** Visual variant for the trigger Button (`trigger="click"` only). */
  export let triggerVariant: "default" | "primary" | "secondary" | "ghost" | "danger" = "default";
  /** Initial open state. */
  export let open = false;
  /** Preferred placement of the panel. */
  export let placement: PopoverContext["placement"] = "bottom";
  /** Delay before opening on hover, in ms (`trigger="hover"` only). */
  export let openDelay = 300;
  /** Delay before closing on leave, in ms (`trigger="hover"` only). */
  export let closeDelay = 200;
  /** Name for the panel. Defaults to being named by the trigger. */
  export let label: string | undefined = undefined;
  /** Called whenever the open state changes. */
  export let onOpenChange: ((open: boolean) => void) | undefined = undefined;

  const handleOpenChange = (next: boolean) => {
    open = next;
    onOpenChange?.(next);
  };

  // Only one primitive is ever built: `??` does not evaluate its right side
  // when click mode already produced a popover.
  const popover =
    trigger === "hover"
      ? undefined
      : createPopover({ open, placement, label, onOpenChange: handleOpenChange });
  const behavior =
    popover ??
    createHoverCard({ open, placement, openDelay, closeDelay, onOpenChange: handleOpenChange });
  const { triggerAction, contentAction, open: isOpen, setOpen } = behavior;

  $: behavior.setOpen(open);
  // Hover mode is a different primitive: a preview has no panel name.
  $: popover?.setLabel(label);

  // First activation (a tap, or a click that beat the hover delay) shows the
  // preview instead of the trigger's own action; once open, the default
  // proceeds (e.g. the link navigates). This is what makes hover mode work on
  // touch, where hover does not exist.
  const previewFirst = (event: MouseEvent) => {
    if (!$isOpen) {
      event.preventDefault();
      setOpen(true);
    }
  };
</script>

{#if trigger === "hover"}
  <!-- The wrapper carries the hover/focus listeners; the slotted element
       (typically a link) stays the focusable trigger. -->
  <!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
  <span class="popover__hover-trigger" use:triggerAction on:click={previewFirst}>
    <slot name="trigger" />
  </span>
{:else}
  <Button variant={triggerVariant} action={triggerAction}>
    <slot name="trigger">{$t("dialog.trigger")}</slot>
  </Button>
{/if}

{#if $isOpen}
  <div class="popover__content" use:portal use:contentAction>
    <slot />
  </div>
{/if}

<style>
  .popover__hover-trigger {
    display: inline-flex;
  }

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
