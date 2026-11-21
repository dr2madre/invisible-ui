<script lang="ts">
  /**
   * Code — inline code: a short run of monospaced text inside a sentence (the
   * `<code>` element), e.g. a function name, a flag, or a value. For a multi-line
   * block use `CodeBlock` instead.
   *
   * Presentational only: its content is the meaning. Colors and the surface tint
   * are themeable CSS custom properties (`--iui-code-*`).
   */
  import type { Snippet } from "svelte";

  interface Props {
    children?: Snippet;
  }

  let { children }: Props = $props();
</script>

<code class="code">{@render children?.()}</code>

<style>
  .code {
    font-family: var(
      --iui-font-mono,
      SFMono-Regular,
      Menlo,
      Monaco,
      Consolas,
      "Liberation Mono",
      "Courier New",
      monospace
    );
    font-size: var(--iui-code-font-size, 0.875em);
    padding: var(--iui-code-padding, 0.1em 0.35em);
    background: var(
      --iui-code-surface,
      var(--iui-components-general-feedback-neutral-background-default, #f5f5f5)
    );
    color: var(--iui-code-text, var(--iui-components-general-foreground-default, #272727));
    border: 1px solid
      var(--iui-code-border, var(--iui-components-general-feedback-neutral-border-default, #bdbdbd));
    border-radius: var(--iui-code-radius, var(--iui-metrics-radius-control, 0.5rem));
    /* Keep the box snug to the text baseline without throwing off line height. */
    line-height: 1.2;
    white-space: break-spaces;
  }
</style>
