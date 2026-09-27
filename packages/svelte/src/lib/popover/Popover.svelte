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
   *   card previews on hover **and keyboard focus** of the trigger passed in
   *   `triggerContent` (typically a link), with open/close delays; focus never
   *   moves into the card, and the card holds nothing focusable. The first
   *   click/tap opens the preview instead of activating the trigger; once
   *   open, the default action (e.g. link navigation) proceeds — so touch
   *   users get the popover contract. Hover content must be
   *   **supplementary**: never put essential information only in here.
   *   Interactive content belongs to `trigger="click"`.
   *
   * Snippets: `triggerContent` (button content, or the focusable element
   * itself in hover mode) and `children` (the card). The snippet cannot be
   * called `trigger`, which names the opening contract. Themeable via
   * `--ds-popover-*`.
   */
  import { untrack, type Snippet } from "svelte";
  import { createPopover, type PopoverContext } from "./create-popover";
  import { portal } from "../internal/portal";
  import { createHoverCard } from "../hover-card/create-hover-card";
  import Button from "../button/Button.svelte";
  import { getI18n } from "../i18n/create-i18n";
  import { controllable } from "../internal/controllable.svelte";

  const { t } = getI18n();

  interface Props {
    /** Opening contract: an intentional click, or a hover/focus preview. */
    trigger?: "click" | "hover";
    /** Visual variant for the trigger Button (`trigger="click"` only). */
    triggerVariant?: "default" | "primary" | "secondary" | "ghost" | "danger";
    /** Initial open state. */
    open?: boolean;
    /** Preferred placement of the panel. */
    placement?: PopoverContext["placement"];
    /** Delay before opening on hover, in ms (`trigger="hover"` only). */
    openDelay?: number;
    /** Delay before closing on leave, in ms (`trigger="hover"` only). */
    closeDelay?: number;
    /** Name for the panel. Defaults to being named by the trigger. */
    label?: string;
    /** Called whenever the open state changes. */
    onOpenChange?: (open: boolean) => void;
    /**
     * The trigger button's content (defaults to the i18n catalog's label), or
     * the focusable trigger element itself in hover mode.
     */
    triggerContent?: Snippet;
    /** The card. */
    children?: Snippet;
  }

  let {
    trigger = "click",
    triggerVariant = "default",
    open = $bindable(false),
    placement = "bottom",
    openDelay = 300,
    closeDelay = 200,
    label,
    onOpenChange,
    triggerContent,
    children,
  }: Props = $props();

  // The prop first, then the report (ADR 0011).
  const handleOpenChange = (next: boolean) => {
    mirror.write(next);
    onOpenChange?.(next);
  };

  // Seeded once from the first props; the mirror and the effect below follow
  // later ones. Only one primitive is ever built: `??` does not evaluate its
  // right side when click mode already produced a popover.
  const { popover, behavior } = untrack(() => {
    const popover =
      trigger === "hover"
        ? undefined
        : createPopover({ open, placement, label, onOpenChange: handleOpenChange });
    const behavior =
      popover ??
      createHoverCard({ open, placement, openDelay, closeDelay, onOpenChange: handleOpenChange });
    return { popover, behavior };
  });
  const { triggerAction, contentAction, open: isOpen, setOpen } = behavior;

  // Controllable mirror through the no-notify sync: opening from the outside
  // is not the user asking for it, so it reports nothing (ADR 0011).
  const mirror = controllable({
    get: () => open,
    set: (next) => (open = next),
    reflect: behavior.syncOpen,
  });
  // Hover mode is a different primitive: a preview has no panel name.
  $effect.pre(() => {
    popover?.setLabel(label);
  });

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
  <!-- The wrapper carries the hover/focus listeners; the element passed in
       (typically a link) stays the focusable trigger. -->
  <!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events -->
  <span class="popover__hover-trigger" use:triggerAction onclick={previewFirst}>
    {@render triggerContent?.()}
  </span>
{:else}
  <Button variant={triggerVariant} action={triggerAction}>
    {#if triggerContent}{@render triggerContent()}{:else}{$t("dialog.trigger")}{/if}
  </Button>
{/if}

{#if $isOpen}
  <div class="popover__content" use:portal use:contentAction>
    {@render children?.()}
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
    color: var(--ds-color-text, #282420);
    border: 1px solid var(--ds-color-border, #c7c1b7);
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
    border-color: var(--ds-color-focus-ring, #8e6cd4);
    box-shadow:
      inset 0 0 0 1px var(--ds-color-focus-ring, #8e6cd4),
      var(
        --ds-elevation-overlay,
        0 10px 15px -3px rgb(0 0 0 / 0.1),
        0 4px 6px -4px rgb(0 0 0 / 0.1)
      );
  }
</style>
