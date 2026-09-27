<script lang="ts">
  /**
   * Blockquote — a block-level quotation (`<blockquote>`), with an optional
   * attribution line. The quoted text is the children; the attribution is the
   * `cite` prop, as plain text or as a snippet for rich content.
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
  import type { Snippet } from "svelte";

  interface Props {
    /** Visible attribution (e.g. an author): plain text, or a snippet for rich content. */
    cite?: string | Snippet;
    /** Machine-readable source URL → the native `cite` attribute (not displayed). */
    citeUrl?: string;
    /** The quoted text. */
    children?: Snippet;
  }

  let { cite, citeUrl, children }: Props = $props();
</script>

<figure class="blockquote">
  <blockquote class="blockquote__quote" cite={citeUrl}>
    {@render children?.()}
  </blockquote>
  {#if cite}
    <figcaption class="blockquote__cite">
      {#if typeof cite === "function"}{@render cite()}{:else}{cite}{/if}
    </figcaption>
  {/if}
</figure>

<style>
  .blockquote {
    margin: 0;
    padding-inline-start: var(--ds-blockquote-padding, 1rem);
    /* The accent bar is decoration with no semantic role, so it reads the
       neutral primitive directly rather than inventing a role for a look. */
    border-inline-start: var(--ds-blockquote-border-width, 3px) solid
      var(--ds-blockquote-accent, var(--ds-neutral-400, #757067));
    color: var(--ds-blockquote-text, var(--ds-color-text-secondary, #524c44));
  }

  .blockquote__quote {
    margin: 0;
    font-style: var(--ds-blockquote-font-style, italic);
    line-height: var(--ds-line-height, 1.4);
  }

  .blockquote__cite {
    margin-block-start: 0.5rem;
    font-size: 0.875rem;
    font-style: normal;
    color: var(--ds-blockquote-cite-text, var(--ds-color-text-secondary, #524c44));
  }
  /* The conventional em dash before an attribution. */
  .blockquote__cite::before {
    content: "— ";
  }
</style>
