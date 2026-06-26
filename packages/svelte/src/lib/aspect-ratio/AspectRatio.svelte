<script lang="ts">
  /**
   * AspectRatio — constrains its content to a fixed width-to-height ratio using
   * the CSS `aspect-ratio` property. Presentational only (no ARIA role): drop in
   * an image, video, iframe or any block content via the default slot, and it is
   * cropped to fill the box.
   *
   * Radius is themeable via `--ds-aspect-ratio-radius`.
   */
  /** Width-to-height ratio, e.g. `16 / 9`, `4 / 3`, `1`. */
  export let ratio = 1;
</script>

<div class="aspect-ratio" style="--ds-aspect-ratio: {ratio};" data-aspect-ratio>
  <slot />
</div>

<style>
  .aspect-ratio {
    aspect-ratio: var(--ds-aspect-ratio, 1);
    inline-size: 100%;
    overflow: hidden;
    border-radius: var(--ds-aspect-ratio-radius, 0);
  }
  /* Common embedded media fills the box. */
  .aspect-ratio :global(img),
  .aspect-ratio :global(video),
  .aspect-ratio :global(iframe) {
    inline-size: 100%;
    block-size: 100%;
    object-fit: cover;
    display: block;
  }
</style>
