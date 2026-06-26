<script lang="ts">
  /**
   * Blockquote — a block-level quotation (`<blockquote>`), with an optional
   * attribution line. The quoted text is the default slot; the attribution can be
   * passed as the `cite` prop (plain text) or the `cite` slot (rich content).
   *
   * Accessibility:
   * - The quote uses the semantic `<blockquote>` element; the attribution sits in
   *   a `<figcaption>` so it is associated with the quote, not announced as part
   *   of it.
   * - `citeUrl` maps to the native `cite` attribute (a machine-readable source
   *   URL), which is not visible — provide a visible attribution too.
   *
   * Colors and the accent border are themeable CSS custom properties
   * (`--ds-blockquote-*`).
   */
  /** Visible attribution text (e.g. an author). Use the `cite` slot for rich content. */
  export let cite: string | undefined = undefined;
  /** Machine-readable source URL → the native `cite` attribute (not displayed). */
  export let citeUrl: string | undefined = undefined;
</script>

<figure class="blockquote">
  <blockquote class="blockquote__quote" cite={citeUrl}>
    <slot />
  </blockquote>
  {#if cite || $$slots.cite}
    <figcaption class="blockquote__cite">
      <slot name="cite">{cite}</slot>
    </figcaption>
  {/if}
</figure>

<style>
  .blockquote {
    margin: 0;
    padding-inline-start: var(--ds-blockquote-padding, 1rem);
    border-inline-start: var(--ds-blockquote-border-width, 3px) solid
      var(--ds-blockquote-accent, var(--ds-color-border, #cbd5e1));
    color: var(--ds-blockquote-text, var(--ds-color-text-secondary, #475569));
  }

  .blockquote__quote {
    margin: 0;
    font-style: var(--ds-blockquote-font-style, italic);
    line-height: 1.5;
  }

  .blockquote__cite {
    margin-block-start: 0.5rem;
    font-size: 0.875rem;
    font-style: normal;
    color: var(--ds-blockquote-cite-text, var(--ds-color-text-secondary, #64748b));
  }
  /* The conventional em dash before an attribution. */
  .blockquote__cite::before {
    content: "— ";
  }
</style>
