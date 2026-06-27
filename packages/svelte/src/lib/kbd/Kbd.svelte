<script lang="ts">
  /**
   * Kbd — a keyboard-shortcut hint rendered with the semantic `<kbd>` element.
   *
   * Pass a single key as the default slot (`<Kbd>Esc</Kbd>`) or a chord as the
   * `keys` array (`keys={["⌘", "K"]}`) — each key gets its own nested `<kbd>` and
   * they are joined by a visible separator (default "+"). The outer element is a
   * `<kbd>` so assistive tech announces it as keyboard input.
   *
   * Presentational only — a light, raised "keycap" on a white surface. Themeable
   * via `--ds-kbd-*`.
   */
  /** A chord of keys, each rendered as its own keycap and joined by `separator`. */
  export let keys: string[] | undefined = undefined;
  /** Separator shown between chord keys. Defaults to "+". */
  export let separator = "+";
</script>

{#if keys && keys.length}
  <kbd class="kbd kbd--chord">
    {#each keys as key, i (i)}
      {#if i > 0}<span class="kbd__sep" aria-hidden="true">{separator}</span>{/if}
      <kbd class="kbd__key">{key}</kbd>
    {/each}
  </kbd>
{:else}
  <kbd class="kbd kbd__key"><slot /></kbd>
{/if}

<style>
  .kbd {
    font-family: var(--ds-kbd-font, var(--ds-font-mono, ui-monospace, monospace));
  }
  .kbd--chord {
    display: inline-flex;
    align-items: center;
    gap: var(--ds-kbd-gap, 0.25rem);
  }
  .kbd__key {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-inline-size: var(--ds-kbd-min-size, 1.5rem);
    padding: var(--ds-kbd-padding, 0.1rem 0.4rem);
    font-size: var(--ds-kbd-font-size, 0.8125em);
    line-height: 1;
    color: var(--ds-kbd-text, var(--ds-color-text, #1c1917));
    background: var(--ds-kbd-bg, var(--ds-color-background, #fff));
    border: 1px solid var(--ds-kbd-border, var(--ds-color-border, #d6d3d1));
    border-radius: var(--ds-kbd-radius, var(--ds-radius-control, 0.375rem));
    box-shadow: var(--ds-kbd-shadow, 0 1px 0 1px var(--ds-color-border, #e7e5e4));
  }
  .kbd__sep {
    color: var(--ds-kbd-sep-text, var(--ds-color-text-secondary, #78716c));
  }
</style>
