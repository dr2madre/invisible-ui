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
  interface Props {
    variant?: "text" | "circle" | "rect";
    /** Number of lines for the `text` variant. */
    lines?: number;
    /** Any CSS length (e.g. "12rem", "100%"). For `circle`, also sets height. */
    width?: string;
    /** Any CSS length. Ignored by `text` (uses line height). */
    height?: string;
    /** Border radius override (any CSS length). */
    radius?: string;
    /** Shimmer animation. Defaults to `pulse`. */
    animation?: "pulse" | "wave" | "none";
    /** When set, the skeleton becomes a polite status with this accessible name. */
    label?: string;
  }

  let {
    variant = "text",
    lines = 1,
    width,
    height,
    radius,
    animation = "pulse",
    label,
  }: Props = $props();

  const rootRole = $derived(label ? "status" : undefined);

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
      class={["skeleton__bar", variant === "circle" && "skeleton__circle"]}
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
    background: var(--ds-skeleton-color, var(--ds-neutral-200, #c7c1b7));
    border-radius: var(--ds-skeleton-radius, var(--ds-radius-control, 0.5rem));
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
