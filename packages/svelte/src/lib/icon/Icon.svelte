<script lang="ts">
  /**
   * Icon — a standardized SVG wrapper for the design system's glyphs and for any
   * icon you drop in. It centralizes the boilerplate that was repeated on every
   * inline `<svg>`: a 24×24 viewBox, `1em` sizing (so icons scale with the
   * surrounding font-size), `currentColor` (so they inherit text color), rounded
   * stroke joins, and accessibility.
   *
   * Provide the glyph itself — `<path>`, `<line>`, `<polyline>`, … — via the
   * default slot. This is also the seam for swapping icon sets: render a Lucide
   * / FontAwesome / custom SVG's inner shapes inside `<Icon>` and they pick up
   * the same sizing and color everywhere.
   *
   * Decorative by default (`aria-hidden`); pass `label` to expose it as an image
   * with an accessible name.
   */
  export let size: string = "1em";
  export let viewBox: string = "0 0 24 24";
  /** Stroke width in viewBox units (glyphs are stroke-based by default). */
  export let strokeWidth: number | string = 2;
  /** Accessible name. When omitted the icon is decorative. */
  export let label: string | undefined = undefined;
  /**
   * Built-in animation for the glyph: `spin` (continuous rotation, e.g. a
   * loader) or `pulse` (opacity beat, e.g. a live indicator). Both respect
   * `prefers-reduced-motion` (the icon stays visible, static).
   */
  export let animation: "none" | "spin" | "pulse" = "none";
  /** Animation duration (any CSS time, e.g. "0.8s"). */
  export let animationDuration: string | undefined = undefined;
  /** Extra classes merged onto the `<svg>` (e.g. for stateful styling). */
  let className = "";
  export { className as class };
</script>

<svg
  class={className ? `icon ${className}` : "icon"}
  data-animation={animation === "none" ? undefined : animation}
  style:--ds-icon-animation-duration={animationDuration}
  {viewBox}
  width={size}
  height={size}
  fill="none"
  stroke="currentColor"
  stroke-width={strokeWidth}
  stroke-linecap="round"
  stroke-linejoin="round"
  role={label ? "img" : undefined}
  aria-label={label}
  aria-hidden={label ? undefined : "true"}
  focusable="false"
>
  <slot />
</svg>

<style>
  .icon {
    display: inline-block;
    flex: none;
    vertical-align: middle;
  }

  .icon[data-animation="spin"] {
    animation: icon-spin var(--ds-icon-animation-duration, 1.2s) linear infinite;
  }
  .icon[data-animation="pulse"] {
    animation: icon-pulse var(--ds-icon-animation-duration, 1.2s) ease-in-out infinite;
  }
  @keyframes icon-spin {
    to {
      transform: rotate(360deg);
    }
  }
  @keyframes icon-pulse {
    0%,
    100% {
      opacity: 0.3;
    }
    50% {
      opacity: 1;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .icon[data-animation] {
      animation: none;
    }
  }
</style>
