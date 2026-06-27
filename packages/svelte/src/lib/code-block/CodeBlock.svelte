<script lang="ts">
  /**
   * CodeBlock — block code: a multi-line, monospaced, preformatted snippet
   * (`<pre><code>`). Pass the source as the `code` prop (preserves whitespace and
   * is what the copy button copies). An optional `language`/`filename` caption and
   * an optional copy-to-clipboard button can be shown.
   *
   * This is a presentational container — it does not do syntax highlighting; wrap
   * already-highlighted markup with the default slot if you need it (the `code`
   * prop still drives the copy button).
   *
   * Accessibility:
   * - The caption labels the region (`aria-label`) so screen-reader users know
   *   what the block contains.
   * - The copy button has an accessible name and announces success via a polite
   *   live region; it is omitted entirely when `copyable` is false.
   *
   * Colors are themeable CSS custom properties (`--ds-code-block-*`).
   */
  /** The source text. Drives the copy button and is rendered when no slot is given. */
  export let code = "";
  /** Optional caption shown in the header (e.g. a language or filename). */
  export let language: string | undefined = undefined;
  /** Render a copy-to-clipboard button. Defaults to `true`. */
  export let copyable = true;
  /** Accessible name for the copy button. */
  export let copyLabel = "Copy code";

  let copied = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  async function copy() {
    try {
      await navigator.clipboard?.writeText(code);
      copied = true;
      clearTimeout(timer);
      timer = setTimeout(() => (copied = false), 2000);
    } catch {
      // Clipboard may be unavailable (insecure context / denied permission);
      // fail silently rather than throwing in the user's face.
    }
  }
</script>

<figure class="code-block" role="group" aria-label={language ? `Code: ${language}` : "Code"}>
  {#if language || copyable}
    <figcaption class="code-block__header">
      {#if language}<span class="code-block__lang">{language}</span>{/if}
      {#if copyable}
        <button type="button" class="code-block__copy" on:click={copy} aria-label={copyLabel}>
          {copied ? "Copied" : "Copy"}
        </button>
      {/if}
    </figcaption>
  {/if}
  <pre class="code-block__pre"><code class="code-block__code"><slot>{code}</slot></code></pre>
  <span class="code-block__live" role="status" aria-live="polite">
    {copied ? "Copied to clipboard" : ""}
  </span>
</figure>

<style>
  .code-block {
    margin: 0;
    background: var(--ds-code-block-surface, var(--ds-color-surface, #f1f5f9));
    color: var(--ds-code-block-text, var(--ds-color-text, #0f172a));
    border: 1px solid var(--ds-code-block-border, var(--ds-color-border, #cbd5e1));
    border-radius: var(--ds-code-block-radius, var(--ds-radius-surface, 0.75rem));
    overflow: hidden;
  }

  .code-block__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: var(--ds-code-block-header-padding, 0.4rem 0.75rem 0.4rem 1rem);
    font-size: 0.75rem;
    border-block-end: 1px solid var(--ds-code-block-border, var(--ds-color-border, #cbd5e1));
  }

  .code-block__lang {
    font-weight: 600;
    letter-spacing: 0.02em;
    text-transform: lowercase;
    opacity: 0.85;
  }

  .code-block__copy {
    margin-inline-start: auto;
    padding: 0.2rem 0.55rem;
    font: inherit;
    font-size: 0.75rem;
    color: inherit;
    background: var(--ds-code-block-copy-bg, rgba(0, 0, 0, 0.05));
    border: 1px solid transparent;
    border-radius: var(--ds-radius-control, 0.375rem);
    cursor: pointer;
    transition: background-color 120ms ease;
  }
  .code-block__copy:hover {
    background: var(--ds-code-block-copy-hover, rgba(0, 0, 0, 0.1));
  }
  .code-block__copy:focus-visible {
    outline: var(--ds-focus-ring-width, 2px) solid var(--ds-color-focus-ring, currentColor);
    outline-offset: 2px;
  }

  .code-block__pre {
    margin: 0;
    padding: var(--ds-code-block-padding, 1rem);
    overflow-x: auto;
  }

  .code-block__code {
    font-family: var(
      --ds-font-mono,
      ui-monospace,
      "SFMono-Regular",
      "SF Mono",
      Menlo,
      Consolas,
      "Liberation Mono",
      monospace
    );
    font-size: var(--ds-code-block-font-size, 0.875rem);
    line-height: 1.6;
    white-space: pre;
  }

  /* Visually-hidden live region for the "copied" announcement. */
  .code-block__live {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    border: 0;
    overflow: hidden;
    clip: rect(0 0 0 0);
    clip-path: inset(50%);
    white-space: nowrap;
  }
</style>
