<script lang="ts">
  /**
   * Button — the styled, batteries-included button. Behaviour and accessibility
   * come from the headless Button (`@invisible-ui/core`); this layer adds the
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
   * is a plus; override either via the `left` / `right` snippets. Colors and sizing
   * are themeable CSS custom properties (`--ds-components-button-*`).
   *
   * `copy` makes it a copy button (ADR 0016): pressing it writes the text to
   * the clipboard and, when that works, shows "Copied" beside the button for
   * two seconds. That text is a polite live region, so it is also announced;
   * the button keeps its name and focus. `copiedLabel` replaces the
   * confirmation text. A refused clipboard shows nothing.
   */
  import { untrack, type Snippet } from "svelte";
  import { createButton, type ButtonVariant } from "./create-button";
  import Icon from "../icon/Icon.svelte";
  import Loading from "../loading/Loading.svelte";
  import { getI18n } from "../i18n/create-i18n";
  import { CopyFeedback } from "../internal/copy-feedback.svelte";
  import type { Action } from "svelte/action";
  import type { Attachment } from "svelte/attachments";

  interface Props {
    /**
     * Optional extra Svelte action applied to the underlying `<button>`. Overlay
     * components (Dialog, Popover, …) pass their `triggerAction` here to compose
     * the Button as their trigger.
     */
    action?: Action<HTMLElement>;
    variant?: ButtonVariant;
    disabled?: boolean;
    /**
     * Loading state: shows an inline spinner in place of the leading icon (or of
     * the glyph, for icon-only buttons), announces `aria-busy` and ignores
     * presses. The label stays visible and the button stays focusable.
     */
    loading?: boolean;
    /**
     * Live loading message announced on every change while `loading` — for a
     * succession of backend-reported steps ("Uploading…" → "Processing…"). It is
     * visually hidden (the button label stays stable); assistive tech hears each
     * step through the spinner's polite status region.
     */
    loadingStatus?: string;
    type?: "button" | "submit" | "reset";
    /** Called when the button is activated (click, or Enter/Space when emulated). */
    onpress?: (event: Event) => void;
    /**
     * Text to copy to the clipboard when the button is pressed. After a
     * successful copy, a confirmation shows beside the button for two seconds
     * and is announced politely (ADR 0016).
     */
    copy?: string;
    /** The confirmation shown after a copy. Defaults to the i18n catalog's "Copied". */
    copiedLabel?: string;
    /** Show a leading icon. Defaults on for `danger` (the hazard cue). */
    leftIcon?: boolean;
    /** Show a trailing icon. */
    rightIcon?: boolean;
    /**
     * Icon-only button: square, no text — pass a single icon as the children
     * and an `ariaLabel` (e.g. the ghost "×" dismiss button in Alert).
     */
    iconOnly?: boolean;
    /**
     * Accessible name. Required for icon-only buttons (no visible text); for
     * buttons with visible text the text is the name and this is unnecessary.
     */
    ariaLabel?: string;
    /** The label, or the single glyph of an icon-only button. */
    children?: Snippet;
    /** Replaces the built-in leading icon. */
    left?: Snippet;
    /** Replaces the built-in trailing icon. */
    right?: Snippet;
  }

  let {
    action = () => {},
    variant = "default",
    disabled = false,
    loading = false,
    loadingStatus,
    type = "button",
    onpress,
    copy,
    copiedLabel,
    leftIcon,
    rightIcon = false,
    iconOnly = false,
    ariaLabel,
    children,
    left,
    right,
  }: Props = $props();

  // Every button needs an accessible name: visible text, or an `ariaLabel` for
  // icon-only buttons (whose children hold a glyph, not text).
  $effect.pre(() => {
    if (import.meta.env?.DEV && !ariaLabel && (iconOnly || !children)) {
      console.warn(
        "[ds] Button has no accessible name: provide visible text (children) or an `ariaLabel` for icon-only buttons.",
      );
    }
  });

  const { t } = getI18n();
  const feedback = new CopyFeedback();
  // An attachment keeps this client-only: the confirmation timer is dropped
  // when the button goes away.
  const dropFeedback: Attachment = () => () => feedback.reset();

  // Seeded once from the first props; the effects below follow later ones.
  const { rootAction, setDisabled, setVariant } = untrack(() =>
    createButton({
      variant,
      disabled,
      type,
      onPress: (event) => {
        if (loading) return;
        onpress?.(event);
        // Read at the press, so a `copy` value changed later is the one copied.
        if (copy != null) void feedback.copy(copy);
      },
    }),
  );

  $effect.pre(() => {
    setDisabled(disabled);
  });
  $effect.pre(() => {
    setVariant(variant);
  });

  // Icon-only buttons carry their single glyph as the children, so never add
  // the auto leading/trailing icon (avoids the danger hazard + glyph doubling up).
  const showLeft = $derived(
    !iconOnly && !loading && ((leftIcon ?? variant === "danger") || left !== undefined),
  );
  const showRight = $derived(!iconOnly && (rightIcon || right !== undefined));
</script>

<button
  class={["button", iconOnly && "button--icon-only"]}
  use:rootAction
  use:action
  {@attach dropFeedback}
  aria-label={ariaLabel}
  aria-busy={loading ? "true" : undefined}
  data-loading={loading ? "" : undefined}
>
  {#if showLeft}
    <span class="button__icon">
      {#if left}
        {@render left()}
      {:else if variant === "danger"}
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
    </span>
  {/if}

  {#if loading}
    <span class="button__icon">
      <Loading variant="spinner" decorative={loadingStatus == null} status={loadingStatus} />
    </span>
  {/if}

  {#if !(loading && iconOnly)}
    {@render children?.()}
  {/if}

  {#if showRight}
    <span class="button__icon">
      {#if right}
        {@render right()}
      {:else}
        <Icon>
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </Icon>
      {/if}
    </span>
  {/if}
</button>
{#if copy != null}
  <!-- Beside the button, never inside it: text inside would change its name.
       It exists while `copy` is set, so the live region is in the page before
       it speaks. -->
  <span class="button__status" role="status"
    >{feedback.copied ? (copiedLabel ?? $t("button.copied")) : ""}</span
  >
{/if}

<style>
  .button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--ds-components-button-spacing-gap);
    padding: var(--ds-components-button-spacing-y) var(--ds-components-button-spacing-x);
    border-radius: var(--ds-components-button-radius);
    border: 1px solid transparent;
    font: inherit;
    font-weight: var(--ds-components-button-typography-font-weight);
    line-height: var(--ds-components-button-typography-line-height);
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
    padding: var(--ds-components-button-spacing-icon, 0.5rem);
    aspect-ratio: 1;
    min-inline-size: var(--ds-components-button-icon-min-size, 2.25rem);
    min-block-size: var(--ds-components-button-icon-min-size, 2.25rem);
  }
  .button--icon-only :global(svg) {
    inline-size: var(--ds-components-button-icon-size, 1.25em);
    block-size: var(--ds-components-button-icon-size, 1.25em);
  }

  .button:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring-shadow);
    outline-offset: var(--ds-components-general-focus-ring-offset, 2px);
  }

  .button:disabled {
    opacity: var(--ds-components-button-opacity-disabled);
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

  /* Copy confirmation: short text beside the button that caused it, which is
     also the polite live region announcing it (ADR 0016). Empty, it takes no
     room. */
  .button__status:not(:empty) {
    margin-inline-start: 0.5rem;
    color: var(--ds-components-button-foreground-supporting);
    font-size: 0.875em;
  }

  .button__icon {
    display: inline-flex;
    flex: none;
  }
  .button__icon :global(svg) {
    inline-size: var(--ds-components-button-icon-size, 1.1em);
    block-size: var(--ds-components-button-icon-size, 1.1em);
  }

  /* default: the baseline, medium-emphasis button — white surface + border. */
  .button:global([data-variant="default"]) {
    background: var(--ds-components-button-background-default);
    color: var(--ds-components-button-foreground-default);
    border-color: var(--ds-components-button-border-default);
  }
  .button:global([data-variant="default"]):hover:not(:disabled) {
    background: var(--ds-components-button-background-hover);
  }

  /* primary: the high-emphasis call to action. */
  .button:global([data-variant="primary"]) {
    background: var(--ds-components-button-background-primary-default);
    color: var(--ds-components-button-foreground-primary-default);
    border-color: var(--ds-components-button-border-primary-default);
  }
  .button:global([data-variant="primary"]):hover:not(:disabled) {
    background: var(--ds-components-button-background-primary-hover);
  }

  /* secondary: alternative emphasized action — a soft tint of the primary. */
  .button:global([data-variant="secondary"]) {
    background: var(--ds-components-button-background-secondary-default);
    color: var(--ds-components-button-foreground-secondary-default);
    border-color: var(--ds-components-button-border-secondary-default);
  }
  .button:global([data-variant="secondary"]):hover:not(:disabled) {
    background: var(--ds-components-button-background-secondary-hover);
  }

  /* ghost: reduced affordance — no fill or border at rest; the label is
     underlined so the affordance never relies on color alone. Icon-only ghosts
     (e.g. the Alert "×") have no text to underline. */
  .button:global([data-variant="ghost"]) {
    background: var(--ds-components-button-background-ghost-default);
    color: var(--ds-components-button-foreground-ghost-default);
    border-color: var(--ds-components-button-border-ghost-default);
  }
  .button:global([data-variant="ghost"]):not(.button--icon-only) {
    text-decoration: underline;
    text-underline-offset: 0.25em;
  }
  .button:global([data-variant="ghost"]):hover:not(:disabled) {
    background: var(--ds-components-button-background-ghost-hover);
  }

  /* danger: destructive. The danger red at 10% with an accessible dark-red
     label and a matching border (the hazard icon keeps meaning off color alone). */
  .button:global([data-variant="danger"]) {
    background: var(--ds-components-button-background-danger-default);
    color: var(--ds-components-button-foreground-danger-default);
    border-color: var(--ds-components-button-border-danger-default);
  }
  .button:global([data-variant="danger"]):hover:not(:disabled) {
    background: var(--ds-components-button-background-danger-hover);
  }
</style>
