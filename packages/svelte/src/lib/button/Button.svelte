<script lang="ts">
  /**
   * Button — the styled, batteries-included button. Behaviour and accessibility
   * come from the headless Button (`@design-system/core`); this layer adds the
   * semantic variants and icon affordances.
   *
   * Variants (semantic, surfaced as `data-variant`):
   * - `default` — the baseline, medium-emphasis button (default).
   * - `primary` — the most important action to move the flow forward.
   * - `secondary` — an alternative emphasized action, on the brand's secondary
   *   color; typically paired next to `primary`.
   * - `ghost`   — reduced affordance (no fill/border at rest), low emphasis.
   * - `danger`  — destructive; uses the `danger` semantic color (the same token
   *   as the feedback icons) and shows a hazard icon by default, so the meaning
   *   never relies on color alone (WCAG 1.4.1 Use of Color).
   *
   * Icons: a plain (un-boxed) leading and/or trailing icon. The built-in glyph
   * is a plus; override either via the `left` / `right` slots. Colors and sizing
   * are themeable CSS custom properties (`--ds-button-*`).
   */
  import { createButton, type ButtonVariant } from "./create-button";
  import Icon from "../icon/Icon.svelte";
  import type { Action } from "svelte/action";

  /**
   * Optional extra Svelte action applied to the underlying `<button>`. Lets
   * overlay components (Dialog, Popover, …) compose the Button as their trigger
   * by passing their `triggerAction`, instead of rendering a bare button.
   */
  export let action: Action<HTMLElement> = () => {};

  export let variant: ButtonVariant = "default";
  /** Soft tone for `danger`: a pastel-red fill with dark text instead of the solid fill. */
  export let soft = false;
  export let disabled = false;
  export let type: "button" | "submit" | "reset" = "button";
  /** Called when the button is activated (click, or Enter/Space when emulated). */
  export let onpress: ((event: Event) => void) | undefined = undefined;
  /** Show a leading icon. Defaults on for `danger` (the hazard cue). */
  export let leftIcon: boolean | undefined = undefined;
  /** Show a trailing icon. */
  export let rightIcon = false;
  /**
   * Icon-only button: square, no text — pass a single icon in the default slot
   * and an `ariaLabel`. (The CloseButton is a preset of this.)
   */
  export let iconOnly = false;
  /**
   * Accessible name. Required for icon-only buttons (no visible text); for
   * buttons with visible text the text is the name and this is unnecessary.
   */
  export let ariaLabel: string | undefined = undefined;

  // Every button needs an accessible name: visible text, or an `ariaLabel` for
  // icon-only buttons (whose slot holds a glyph, not text).
  $: if (import.meta.env?.DEV && !ariaLabel && (iconOnly || !$$slots.default)) {
    console.warn(
      "[ds] Button has no accessible name: provide visible text (default slot) or an `ariaLabel` for icon-only buttons.",
    );
  }

  const { rootAction, setDisabled, setVariant } = createButton({
    variant,
    disabled,
    type,
    onPress: (event) => onpress?.(event),
  });

  $: setDisabled(disabled);
  $: setVariant(variant);

  $: showLeft = (leftIcon ?? variant === "danger") || $$slots.left;
  $: showRight = rightIcon || $$slots.right;
</script>

<button
  class="button"
  class:button--icon-only={iconOnly}
  class:button--soft={soft}
  use:rootAction
  use:action
  aria-label={ariaLabel}
>
  {#if showLeft}
    <span class="button__icon">
      <slot name="left">
        {#if variant === "danger"}
          <Icon>
            <path
              d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
            />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12" y2="17" />
          </Icon>
        {:else}
          <Icon>
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </Icon>
        {/if}
      </slot>
    </span>
  {/if}

  <slot />

  {#if showRight}
    <span class="button__icon">
      <slot name="right">
        <Icon>
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </Icon>
      </slot>
    </span>
  {/if}
</button>

<style>
  .button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--ds-button-gap, 0.5rem);
    padding: var(--ds-button-padding, 0.5rem 0.875rem);
    border-radius: var(--ds-button-radius, var(--ds-radius-control, 0.5rem));
    border: 1px solid transparent;
    font: inherit;
    font-weight: 600;
    line-height: 1.2;
    cursor: pointer;
    transition:
      background-color 120ms ease,
      border-color 120ms ease,
      color 120ms ease;
  }

  /* Icon-only: square, equal padding, comfortable target; sizes the slotted glyph. */
  .button--icon-only {
    padding: var(--ds-button-icon-padding, 0.5rem);
    aspect-ratio: 1;
    min-inline-size: var(--ds-button-icon-min, 2.25rem);
    min-block-size: var(--ds-button-icon-min, 2.25rem);
  }
  .button--icon-only :global(svg) {
    inline-size: var(--ds-button-icon-size, 1.25em);
    block-size: var(--ds-button-icon-size, 1.25em);
  }

  .button:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring-shadow);
    outline-offset: var(--ds-focus-ring-offset, 2px);
  }

  .button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .button__icon {
    display: inline-flex;
    flex: none;
  }
  .button__icon :global(svg) {
    inline-size: var(--ds-button-icon-size, 1.1em);
    block-size: var(--ds-button-icon-size, 1.1em);
  }

  /* default: the baseline, medium-emphasis button — white surface + border. */
  .button:global([data-variant="default"]) {
    background: var(--ds-button-bg, var(--ds-color-background, #fff));
    color: var(--ds-color-text, #0f172a);
    border-color: var(--ds-color-border, #cbd5e1);
  }
  .button:global([data-variant="default"]):hover:not(:disabled) {
    background: var(--ds-button-bg-hover, var(--ds-color-surface, #f1f5f9));
  }

  /* primary: the high-emphasis call to action. */
  .button:global([data-variant="primary"]) {
    background: var(--ds-color-primary, #2563eb);
    color: var(--ds-color-on-primary, #fff);
  }
  .button:global([data-variant="primary"]):hover:not(:disabled) {
    background: var(--ds-color-primary-hover, #1d4ed8);
  }

  /* secondary: alternative emphasized action, on the brand's secondary color. */
  .button:global([data-variant="secondary"]) {
    background: var(--ds-color-secondary, #7c3aed);
    color: var(--ds-color-on-secondary, #fff);
  }
  .button:global([data-variant="secondary"]):hover:not(:disabled) {
    background: var(--ds-color-secondary-hover, #6d28d9);
  }

  /* ghost: reduced affordance — no fill or border at rest. */
  .button:global([data-variant="ghost"]) {
    background: transparent;
    color: inherit;
  }
  .button:global([data-variant="ghost"]):hover:not(:disabled) {
    background: var(--ds-state-hover, rgb(0 0 0 / 0.06));
  }

  /* danger: destructive, on the shared danger semantic color. */
  .button:global([data-variant="danger"]) {
    background: var(--ds-color-danger, #dc2626);
    color: var(--ds-color-on-status, #fff);
  }
  .button:global([data-variant="danger"]):hover:not(:disabled) {
    background: var(--ds-color-danger-hover, #b91c1c);
  }
  /* soft danger: pastel-red fill with dark text. */
  .button--soft:global([data-variant="danger"]) {
    background: var(--ds-color-danger-soft, #e5a1ac);
    color: var(--ds-color-on-danger-soft, #7f1d1d);
  }
  .button--soft:global([data-variant="danger"]):hover:not(:disabled) {
    background: color-mix(in srgb, var(--ds-color-danger-soft, #e5a1ac) 85%, #000);
  }
</style>
