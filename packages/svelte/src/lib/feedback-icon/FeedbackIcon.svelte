<script lang="ts">
  /**
   * FeedbackIcon — a status icon enclosed in a rounded, colored box (the
   * "system icon" look). It conveys the *type* of feedback (info / success /
   * warning / danger / neutral) at a glance, which is an accessibility aid for
   * alerts and similar messages.
   *
   * This is intentionally a *styled* component (it ships SVGs + CSS), unlike the
   * headless primitives. Colors are CSS custom properties (`--ds-feedback-*`)
   * with sensible defaults, so they remain themeable.
   *
   * A built-in icon is provided per status; pass your own via the default slot
   * to override it. The box is decorative by default (`aria-hidden`); pass
   * `label` to expose it as an image with an accessible name.
   */
  import Icon from "../icon/Icon.svelte";

  export let status: "info" | "success" | "warning" | "danger" | "neutral" = "info";
  export let label: string | undefined = undefined;
  /**
   * Box treatment behind the glyph:
   * - `"tint"` (default): a soft status-colored chip.
   * - `"transparent"`: no box — just the colored glyph. Use on already-tinted
   *   surfaces (e.g. inside a colored Alert) so the chip doesn't clash.
   * - `"solid"`: a full status-colored box with a contrasting (white) glyph.
   */
  export let box: "tint" | "transparent" | "solid" = "tint";
  /** Box shape — `"rounded"` (default) or a full `"round"` circle. */
  export let shape: "rounded" | "round" = "rounded";
</script>

<span
  class="feedback-icon"
  data-status={status}
  data-box={box}
  data-shape={shape}
  role={label ? "img" : undefined}
  aria-label={label}
  aria-hidden={label ? undefined : "true"}
>
  <slot>
    {#if status === "success"}
      <Icon size="100%" strokeWidth={2.5}>
        <polyline points="20 6 9 17 4 12" />
      </Icon>
    {:else if status === "warning"}
      <Icon size="100%">
        <path
          d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
        />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12" y2="17" />
      </Icon>
    {:else if status === "danger"}
      <!-- danger = an octagon (stop sign) with an ×, distinct from the round info -->
      <Icon size="100%">
        <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </Icon>
    {:else if status === "neutral"}
      <!-- neutral = a tip / suggestion (lightbulb) -->
      <Icon size="100%">
        <path d="M9 18h6" />
        <path d="M10 22h4" />
        <path
          d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"
        />
      </Icon>
    {:else}
      <!-- info (default) -->
      <Icon size="100%">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="11" x2="12" y2="16" />
        <line x1="12" y1="8" x2="12" y2="8" />
      </Icon>
    {/if}
  </slot>
</span>

<style>
  .feedback-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    flex: none;
    inline-size: var(--ds-feedback-icon-size, 2rem);
    block-size: var(--ds-feedback-icon-size, 2rem);
    /* Default breathing room around the glyph; themeable. With border-box the
       padding carves a definite content box the SVG can fill (no circular %). */
    padding: var(--ds-feedback-icon-padding, 0.375rem);
    border-radius: var(--ds-feedback-icon-radius, var(--ds-radius-control, 0.5rem));
    /* Glyph at full status color; box tinted with the same color at 15%. */
    color: var(--_color);
    background: color-mix(in srgb, var(--_color) 15%, transparent);
  }

  /* Transparent box: drop the chip, keep the colored glyph (for tinted surfaces). */
  .feedback-icon:global([data-box="transparent"]) {
    background: transparent;
    padding: 0;
  }
  /* Solid box: full status color with a contrasting glyph. */
  .feedback-icon:global([data-box="solid"]) {
    background: var(--_color);
    color: var(--ds-feedback-icon-on-solid, #fff);
  }
  /* Full circle. */
  .feedback-icon:global([data-shape="round"]) {
    border-radius: 50%;
  }

  /* The glyph (built-in or slotted) fills the padded content box and centers. */
  .feedback-icon :global(svg) {
    display: block;
    inline-size: 100%;
    block-size: 100%;
  }

  /* Status is a dynamic attribute, so the value part must be :global. */
  .feedback-icon:global([data-status="info"]) {
    --_color: var(--ds-color-info, #2563eb);
  }
  .feedback-icon:global([data-status="success"]) {
    --_color: var(--ds-color-success, #16a34a);
  }
  .feedback-icon:global([data-status="warning"]) {
    --_color: var(--ds-color-warning, #d97706);
  }
  .feedback-icon:global([data-status="danger"]) {
    --_color: var(--ds-color-danger, #dc2626);
  }
  .feedback-icon:global([data-status="neutral"]) {
    --_color: var(--ds-color-neutral, #64748b);
  }
</style>
