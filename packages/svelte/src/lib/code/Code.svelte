<script lang="ts">
  /**
   * Code — inline code: a short run of monospaced text inside a sentence (the
   * `<code>` element), e.g. a function name, a flag, or a value. For a multi-line
   * block use `CodeBlock` instead.
   *
   * Presentational only: its content is the meaning. Colors and the surface tint
   * are themeable CSS custom properties (`--ds-code-*`).
   */
</script>

<code class="code"><slot /></code>

<style>
  .code {
    font-family: var(
      --ds-font-mono,
      SFMono-Regular,
      Menlo,
      Monaco,
      Consolas,
      "Liberation Mono",
      "Courier New",
      monospace
    );
    font-size: var(--ds-code-font-size, 0.875em);
    padding: var(--ds-code-padding, 0.1em 0.35em);
    background: var(--ds-code-surface, var(--ds-color-neutral-surface, #f4f2ef));
    color: var(--ds-code-text, var(--ds-color-text, #282420));
    border: 1px solid var(--ds-code-border, var(--ds-color-neutral-border, #c7c1b7));
    border-radius: var(--ds-code-radius, var(--ds-radius-control, 0.5rem));
    /* Keep the box snug to the text baseline without throwing off line height. */
    line-height: 1.2;
    white-space: break-spaces;
  }
</style>
