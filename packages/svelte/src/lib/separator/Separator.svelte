<script lang="ts">
  /**
   * Separator — a thin visual divider between content or groups of controls.
   *
   * Accessibility: by default it is a semantic separator (`role="separator"`
   * with `aria-orientation`). Set `decorative` when it carries no meaning (e.g.
   * purely visual spacing inside a toolbar that already groups its items) so it
   * is hidden from assistive tech.
   *
   * Color and thickness are themeable CSS custom properties (`--ds-separator-*`,
   * falling back to `--ds-color-border`).
   */
  export let orientation: "horizontal" | "vertical" = "horizontal";
  /** Hide from assistive tech (purely visual). */
  export let decorative = false;
</script>

<div
  class="separator"
  data-orientation={orientation}
  role={decorative ? "none" : "separator"}
  aria-orientation={decorative ? undefined : orientation}
></div>

<style>
  .separator {
    flex: none;
    background: var(--ds-separator-color, var(--ds-color-border, #cbd5e1));
    border: 0;
  }
  .separator:global([data-orientation="horizontal"]) {
    inline-size: 100%;
    block-size: var(--ds-separator-thickness, 1px);
    margin-block: var(--ds-separator-gap, 0);
  }
  .separator:global([data-orientation="vertical"]) {
    align-self: stretch;
    inline-size: var(--ds-separator-thickness, 1px);
    min-block-size: 1em;
    margin-inline: var(--ds-separator-gap, 0);
  }
</style>
