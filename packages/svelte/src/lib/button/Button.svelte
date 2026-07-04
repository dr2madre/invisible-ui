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
  import Loading from "../loading/Loading.svelte";
  import type { Action } from "svelte/action";

  /**
   * Optional extra Svelte action applied to the underlying `<button>`. Lets
   * overlay components (Dialog, Popover, …) compose the Button as their trigger
   * by passing their `triggerAction`, instead of rendering a bare button.
   */
  export let action: Action<HTMLElement> = () => {};

  export let variant: ButtonVariant = "default";
  export let disabled = false;
  /**
   * Loading state: shows an inline spinner in place of the leading icon (or of
   * the glyph, for icon-only buttons), announces `aria-busy` and ignores
   * presses. The label stays visible and the button stays focusable.
   */
  export let loading = false;
  /**
   * Live loading message announced on every change while `loading` — for a
   * succession of backend-reported steps ("Uploading…" → "Processing…"). It is
   * visually hidden (the button label stays stable); assistive tech hears each
   * step through the spinner's polite status region.
   */
  export let loadingStatus: string | undefined = undefined;
  export let type: "button" | "submit" | "reset" = "button";
  /** Called when the button is activated (click, or Enter/Space when emulated). */
  export let onpress: ((event: Event) => void) | undefined = undefined;
  /** Show a leading icon. Defaults on for `danger` (the hazard cue). */
  export let leftIcon: boolean | undefined = undefined;
  /** Show a trailing icon. */
  export let rightIcon = false;
  /**
   * Icon-only button: square, no text — pass a single icon in the default slot
   * and an `ariaLabel` (e.g. the ghost "×" dismiss button in Alert).
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
    onPress: (event) => {
      if (!loading) onpress?.(event);
    },
  });

  $: setDisabled(disabled);
  $: setVariant(variant);

  // Icon-only buttons carry their single glyph in the default slot, so never add
  // the auto leading/trailing icon (avoids the danger hazard + glyph doubling up).
  $: showLeft = !iconOnly && !loading && ((leftIcon ?? variant === "danger") || $$slots.left);
  $: showRight = !iconOnly && (rightIcon || $$slots.right);
</script>

<button
  class="button"
  class:button--icon-only={iconOnly}
  use:rootAction
  use:action
  aria-label={ariaLabel}
  aria-busy={loading ? "true" : undefined}
  data-loading={loading ? "" : undefined}
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

  {#if loading}
    <span class="button__icon">
      <Loading variant="spinner" decorative={loadingStatus == null} status={loadingStatus} />
    </span>
  {/if}

  {#if !(loading && iconOnly)}
    <slot />
  {/if}

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
    padding: var(
      --ds-button-padding,
      var(--ds-control-padding-y, 0.5rem) var(--ds-control-padding-x, 0.875rem)
    );
    border-radius: var(--ds-button-radius, var(--ds-radius-control, 0.5rem));
    border: 1px solid transparent;
    font: inherit;
    font-weight: 500;
    line-height: 1.2;
    cursor: pointer;
    /* No tap delay / synthesized ghost clicks on touch (iOS Safari). */
    touch-action: manipulation;
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

  .button:global([data-loading]) {
    cursor: progress;
  }
  /* The live loading status is announced, never shown: the button label must
     stay stable while the spinner's status region reads out each step. */
  .button :global(.loading__status) {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
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

  /* secondary: alternative emphasized action — a soft tint of the primary. */
  .button:global([data-variant="secondary"]) {
    background: var(
      --ds-color-primary-soft,
      color-mix(in srgb, var(--ds-color-primary, #2563eb) 10%, #fff)
    );
    color: var(--ds-color-on-primary-soft, var(--ds-color-primary, #2563eb));
    border-color: color-mix(in srgb, var(--ds-color-primary, #2563eb) 55%, transparent);
  }
  .button:global([data-variant="secondary"]):hover:not(:disabled) {
    background: color-mix(
      in srgb,
      var(--ds-color-primary, #2563eb) 24%,
      var(--ds-color-background, #fff)
    );
  }

  /* ghost: reduced affordance — no fill or border at rest; the label is
     underlined so the affordance never relies on color alone. Icon-only ghosts
     (e.g. the Alert "×") have no text to underline. */
  .button:global([data-variant="ghost"]) {
    background: transparent;
    color: inherit;
  }
  .button:global([data-variant="ghost"]):not(.button--icon-only) {
    text-decoration: underline;
    text-underline-offset: 0.25em;
  }
  .button:global([data-variant="ghost"]):hover:not(:disabled) {
    background: var(--ds-state-hover, rgb(0 0 0 / 0.06));
  }

  /* danger: destructive. The danger red at 10% with an accessible dark-red
     label and a matching border (the hazard icon keeps meaning off color alone). */
  .button:global([data-variant="danger"]) {
    background: var(--ds-color-danger-soft, color-mix(in srgb, #dc2626 10%, #fff));
    color: var(--ds-color-on-danger-soft, #b91c1c);
    border-color: color-mix(in srgb, var(--ds-feedback-danger, #dc2626) 35%, transparent);
  }
  .button:global([data-variant="danger"]):hover:not(:disabled) {
    background: color-mix(
      in srgb,
      var(--ds-feedback-danger, #dc2626) 18%,
      var(--ds-color-background, #fff)
    );
  }
</style>
