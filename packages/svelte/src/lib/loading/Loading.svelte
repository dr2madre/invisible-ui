<script lang="ts">
  /**
   * Loading — an inline loading indicator. Variants: `dots` (three dots that
   * pulse in turn), `spinner` (a rotating arc), `typing` (bouncing dots — chat
   * "waiting for a reply"), `morph` (a shape blending square ⇄ circle), and
   * `bar` (a full-width track — indeterminate sliding segment, or a growing
   * fill when given a `value`). Everything uses `currentColor`, so it follows
   * the surface's own text color.
   *
   * Accessibility: by default a polite `role="status"` named by `label` (from
   * the i18n catalog when not passed). A determinate bar is a `progressbar`
   * with `aria-value*` (and `aria-valuetext` when `detail` is set). The visible
   * text is `aria-hidden` — the accessible name/value already carries it, and a
   * ticking percentage inside a live region would otherwise be re-announced on
   * every change. Set `decorative` when the surrounding region announces the
   * state itself (e.g. a button with `aria-busy`). All motion respects
   * `prefers-reduced-motion` (indicators stay visible, static).
   *
   * Sizing follows the font (`1em`); themeable via `--ds-loading-size`,
   * `--ds-loading-gap`, `--ds-loading-spinner-size`, `--ds-loading-bar-height`,
   * `--ds-loading-label-size`, `--ds-loading-label-gap`,
   * `--ds-loading-bar-label-gap` and `--ds-loading-duration` (animation speed).
   */
  import { getI18n } from "../i18n/create-i18n";

  const { t } = getI18n();

  /**
   * Indicator shape: pulsing `dots`, a rotating `spinner` arc, bouncing
   * `typing` dots (chat "waiting for a reply"), a `morph`ing shape
   * (square ⇄ circle), or a `bar` (full-width track — place it at the top of
   * the content it covers, e.g. a card).
   */
  export let variant: "dots" | "spinner" | "bar" | "typing" | "morph" = "dots";
  /**
   * Completion percentage (0–100) for the `bar` variant: the bar becomes
   * determinate (a fill that grows to done) and exposes progressbar semantics.
   * Leave `null` for the indeterminate sliding segment.
   */
  export let value: number | null = null;
  /** Accessible name. Defaults to the i18n catalog's "Loading…". */
  export let label: string | undefined = undefined;
  /** Also render the label as visible text next to the indicator. */
  export let showLabel = false;
  /** Show the percentage (from `value`) as visible text. */
  export let showValue = false;
  /**
   * Extra visible detail, e.g. "3 of 8 files" or "48 MB of 128 MB". On a
   * determinate bar it is also exposed as `aria-valuetext`.
   */
  export let detail: string | undefined = undefined;
  /** Hide from assistive tech (the surrounding region announces the state). */
  export let decorative = false;

  $: resolvedLabel = label ?? $t("loading.label");
  $: determinate = variant === "bar" && value != null;
  $: clamped = value == null ? null : Math.min(100, Math.max(0, value));
  $: hasText = showLabel || detail != null || (showValue && clamped != null);
</script>

<span
  class="loading"
  data-variant={variant}
  role={decorative ? undefined : determinate ? "progressbar" : "status"}
  aria-label={decorative ? undefined : resolvedLabel}
  aria-hidden={decorative ? "true" : undefined}
  aria-valuemin={determinate && !decorative ? 0 : undefined}
  aria-valuemax={determinate && !decorative ? 100 : undefined}
  aria-valuenow={determinate && !decorative ? clamped : undefined}
  aria-valuetext={determinate && !decorative ? detail : undefined}
>
  {#if variant === "bar"}
    <span class="loading__track">
      {#if determinate}
        <span class="loading__fill" style="inline-size: {clamped}%;"></span>
      {:else}
        <span class="loading__segment"></span>
      {/if}
    </span>
  {:else}
    <span class="loading__indicator">
      {#if variant === "spinner"}
        <svg
          class="loading__spinner"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M21 12a9 9 0 1 1-6.2-8.56" />
        </svg>
      {:else if variant === "morph"}
        <span class="loading__shape"></span>
      {:else}
        <span class="loading__dot"></span>
        <span class="loading__dot"></span>
        <span class="loading__dot"></span>
      {/if}
    </span>
  {/if}
  {#if hasText}
    <!-- Hidden from AT: the name/value attributes above already carry this, and
         live regions would re-announce every tick of a changing percentage. -->
    <span class="loading__label" aria-hidden="true">
      {#if showLabel}<span>{resolvedLabel}</span>{/if}
      {#if showValue && clamped != null}<span class="loading__meta">{Math.round(clamped)}%</span
        >{/if}
      {#if detail != null}<span class="loading__meta">{detail}</span>{/if}
    </span>
  {/if}
</span>

<style>
  .loading {
    display: inline-flex;
    align-items: center;
    gap: var(--ds-loading-label-gap, 0.625em);
  }
  /* The indicator sits in its own box so text (or anything else) can be laid
     out beside it without touching the dots' internal spacing. */
  .loading__indicator {
    display: inline-flex;
    align-items: center;
    gap: var(--ds-loading-gap, 0.25em);
    block-size: 1em;
  }
  .loading__dot {
    inline-size: var(--ds-loading-size, 0.3em);
    block-size: var(--ds-loading-size, 0.3em);
    border-radius: var(--ds-radius-pill, 999px);
    background: currentColor;
    animation: loading-pulse var(--ds-loading-duration, 1.2s) ease-in-out infinite;
  }
  .loading__dot:nth-child(2) {
    animation-delay: calc(var(--ds-loading-duration, 1.2s) / 6);
  }
  .loading__dot:nth-child(3) {
    animation-delay: calc(var(--ds-loading-duration, 1.2s) / 3);
  }
  .loading__spinner {
    inline-size: var(--ds-loading-spinner-size, 1em);
    block-size: var(--ds-loading-spinner-size, 1em);
    animation: loading-spin var(--ds-loading-duration, 1.2s) linear infinite;
  }
  /* Bar: a full-width track (sliding segment when indeterminate, growing fill
     when determinate), with the optional text line underneath. */
  .loading[data-variant="bar"] {
    display: flex;
    flex-direction: column;
    gap: var(--ds-loading-bar-label-gap, 0.375em);
    inline-size: 100%;
    block-size: auto;
  }
  .loading__track {
    display: block;
    inline-size: 100%;
    block-size: var(--ds-loading-bar-height, 3px);
    background: color-mix(in srgb, currentColor 20%, transparent);
    border-radius: var(--ds-radius-pill, 999px);
    overflow: hidden;
  }
  .loading__segment {
    display: block;
    inline-size: 40%;
    block-size: 100%;
    border-radius: inherit;
    background: currentColor;
    animation: loading-slide var(--ds-loading-duration, 1.4s) ease-in-out infinite;
  }
  /* Determinate bar: a fill that grows start → end until done. */
  .loading__fill {
    display: block;
    block-size: 100%;
    border-radius: inherit;
    background: currentColor;
    transition: inline-size 200ms ease;
  }
  /* Visible text: label start-aligned, value/detail pushed to the end on bars. */
  .loading__label {
    display: inline-flex;
    gap: 0.75em;
    font-size: var(--ds-loading-label-size, 0.8125em);
    line-height: 1.2;
  }
  .loading[data-variant="bar"] .loading__label {
    inline-size: 100%;
    justify-content: space-between;
  }
  .loading__meta {
    font-variant-numeric: tabular-nums;
  }

  /* Typing: the dots bounce in turn instead of pulsing. */
  .loading[data-variant="typing"] .loading__dot {
    animation-name: loading-bounce;
  }
  /* Morph: one shape blending square ⇄ circle while it swings half a turn
     forth and back. */
  .loading__shape {
    inline-size: var(--ds-loading-spinner-size, 1em);
    block-size: var(--ds-loading-spinner-size, 1em);
    background: currentColor;
    animation: loading-morph var(--ds-loading-duration, 2s) ease-in-out infinite;
  }
  @keyframes loading-pulse {
    0%,
    100% {
      opacity: 0.3;
    }
    50% {
      opacity: 1;
    }
  }
  @keyframes loading-spin {
    to {
      transform: rotate(360deg);
    }
  }
  @keyframes loading-slide {
    from {
      transform: translateX(-100%);
    }
    to {
      transform: translateX(250%);
    }
  }
  /* RTL: the segment travels start → end, so the motion flips with the text. */
  :global([dir="rtl"]) .loading__segment {
    animation-name: loading-slide-rtl;
  }
  @keyframes loading-slide-rtl {
    from {
      transform: translateX(100%);
    }
    to {
      transform: translateX(-250%);
    }
  }
  @keyframes loading-bounce {
    0%,
    100% {
      transform: none;
      opacity: 0.5;
    }
    50% {
      transform: translateY(-40%);
      opacity: 1;
    }
  }
  @keyframes loading-morph {
    0%,
    100% {
      border-radius: 15%;
      transform: rotate(0deg);
    }
    50% {
      border-radius: 50%;
      transform: rotate(180deg);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .loading__dot,
    .loading__spinner,
    .loading__segment,
    .loading__shape {
      animation: none;
    }
    .loading__fill {
      transition: none;
    }
  }
</style>
