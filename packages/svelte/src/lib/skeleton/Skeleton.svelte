<script lang="ts">
  /**
   * Skeleton — a loading placeholder that mirrors the shape of content while it
   * loads. Three shapes: `text` (one or more lines; the last is shortened),
   * `circle` (e.g. an avatar) and `rect` (e.g. an image or card).
   *
   * Accessibility: a skeleton is purely visual, so by default it is hidden from
   * assistive tech (`aria-hidden`) — announce the loading state on the
   * surrounding region (e.g. `aria-busy="true"`). Alternatively pass a `label`
   * to make this element a polite `role="status"` that announces (e.g.)
   * "Loading…".
   *
   * Sizing is set via `width`/`height` (any CSS length); for `text` the height
   * follows the line height. The shimmer is themeable via `--ds-skeleton-*` and
   * respects `prefers-reduced-motion`.
   */
  export let variant: "text" | "circle" | "rect" = "text";
  /** Number of lines for the `text` variant. */
  export let lines = 1;
  /** Any CSS length (e.g. "12rem", "100%"). For `circle`, also sets height. */
  export let width: string | undefined = undefined;
  /** Any CSS length. Ignored by `text` (uses line height). */
  export let height: string | undefined = undefined;
  /** Border radius override (any CSS length). */
  export let radius: string | undefined = undefined;
  /** Shimmer animation. Defaults to `pulse`. */
  export let animation: "pulse" | "wave" | "none" = "pulse";
  /** When set, the skeleton becomes a polite status with this accessible name. */
  export let label: string | undefined = undefined;

  $: rootRole = label ? "status" : undefined;

  const lengths = (n: number) => Array.from({ length: Math.max(1, n) }, (_, i) => i);
</script>

<div
  class="skeleton"
  data-variant={variant}
  data-animation={animation}
  role={rootRole}
  aria-label={label}
  aria-busy={label ? "true" : undefined}
  aria-hidden={label ? undefined : "true"}
>
  {#if variant === "text"}
    {#each lengths(lines) as i (i)}
      <span
        class="skeleton__bar skeleton__line"
        style:width={i === lines - 1 && lines > 1 ? "60%" : width}
        style:border-radius={radius}
      ></span>
    {/each}
  {:else}
    <span
      class="skeleton__bar"
      class:skeleton__circle={variant === "circle"}
      style:width
      style:height={variant === "circle" ? (width ?? height) : height}
      style:border-radius={radius}
    ></span>
  {/if}
</div>

<style>
  .skeleton {
    display: flex;
    flex-direction: column;
    gap: var(--ds-skeleton-line-gap, 0.5rem);
  }

  .skeleton__bar {
    display: block;
    background: var(--ds-skeleton-color, var(--ds-neutral-200, #e7e5e4));
    border-radius: var(--ds-skeleton-radius, var(--ds-radius-control, 0.375rem));
  }

  .skeleton__line {
    inline-size: 100%;
    block-size: var(--ds-skeleton-line-height, 0.8em);
  }

  .skeleton__circle {
    border-radius: 50%;
    inline-size: var(--ds-skeleton-circle-size, 2.5rem);
    block-size: var(--ds-skeleton-circle-size, 2.5rem);
  }

  /* Pulse: gently fade the placeholder in and out. */
  .skeleton[data-animation="pulse"] .skeleton__bar {
    animation: ds-skeleton-pulse 1.5s ease-in-out infinite;
  }
  @keyframes ds-skeleton-pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.4;
    }
  }

  /* Wave: sweep a highlight across the placeholder. */
  .skeleton[data-animation="wave"] .skeleton__bar {
    position: relative;
    overflow: hidden;
  }
  .skeleton[data-animation="wave"] .skeleton__bar::after {
    content: "";
    position: absolute;
    inset: 0;
    transform: translateX(-100%);
    background: linear-gradient(
      90deg,
      transparent,
      var(--ds-skeleton-highlight, rgba(255, 255, 255, 0.5)),
      transparent
    );
    animation: ds-skeleton-wave 1.6s linear infinite;
  }
  @keyframes ds-skeleton-wave {
    100% {
      transform: translateX(100%);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .skeleton .skeleton__bar,
    .skeleton .skeleton__bar::after {
      animation: none;
    }
  }
</style>
