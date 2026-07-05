<script>
  import Popover from "@design-system/svelte/Popover.svelte";
</script>

<div style="display: grid; gap: 1.5rem;">
  <figure style="margin: 0; display: grid; gap: 0.5rem; justify-items: start;">
    <Popover>
      <span slot="trigger">Open popover</span>
      <div style="display:grid; gap:0.25rem;">
        <strong>Popover</strong>
        <span>Non-modal floating panel, positioned with Floating UI.</span>
      </div>
    </Popover>
    <figcaption style="font-size: 0.8125rem; color: var(--ds-color-text-secondary);">
      <code>trigger="click"</code> (default) — opened intentionally; focus moves in.
    </figcaption>
  </figure>

  <figure style="margin: 0; display: grid; gap: 0.5rem; justify-items: start;">
    <span>
      Written by
      <Popover trigger="hover">
        <a slot="trigger" href="#ada">@ada</a>
        <div style="display:grid; gap:0.25rem; max-inline-size: 16rem;">
          <strong>Ada Lovelace</strong>
          <span>Mathematician; wrote the first published algorithm.</span>
          <a href="#follow">Follow</a>
        </div>
      </Popover>
    </span>
    <figcaption style="font-size: 0.8125rem; color: var(--ds-color-text-secondary);">
      <code>trigger="hover"</code> — previews on hover <em>and keyboard focus</em>; focus never
      moves in. First click/tap opens the preview, the second follows the link (the touch fallback).
      Supplementary content only.
    </figcaption>
  </figure>
</div>
