<script lang="ts">
  /**
   * AspectRatio — constrains its content to a fixed width-to-height ratio using
   * the CSS `aspect-ratio` property. Presentational only (no ARIA role): drop in
   * an image, video, iframe or any block content via the default slot, and it is
   * cropped to fill the box.
   *
   * Radius is themeable via `--ds-aspect-ratio-radius`.
   */
  import type { Snippet } from "svelte";

  interface Props {
    /** Width-to-height ratio, e.g. `16 / 9`, `4 / 3`, `1`. */
    ratio?: number;
    children?: Snippet;
  }

  let { ratio = 1, children }: Props = $props();
</script>

<!-- The ratio flows through a private variable: the prop always sets it
     inline, so an external custom-property override could never win. -->
<div class="aspect-ratio" style="--_aspect-ratio: {ratio};" data-aspect-ratio>
  {@render children?.()}
</div>

<style>
  .aspect-ratio {
    aspect-ratio: var(--_aspect-ratio, 1);
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
