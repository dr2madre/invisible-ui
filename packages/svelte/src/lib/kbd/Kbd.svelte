<script lang="ts">
  /**
   * Kbd — a keyboard-shortcut hint rendered with the semantic `<kbd>` element.
   *
   * Pass a single key as `children` (`<Kbd>Esc</Kbd>`) or a chord as the
   * `keys` array (`keys={["⌘", "K"]}`) — each key gets its own nested `<kbd>` and
   * they are joined by a visible separator (default "+"). The outer element is a
   * `<kbd>` so assistive tech announces it as keyboard input.
   *
   * Presentational only — a light, raised "keycap" on a white surface. Themeable
   * via `--iui-kbd-*`.
   */
  import type { Snippet } from "svelte";

  interface Props {
    /** A chord of keys, each rendered as its own keycap and joined by `separator`. */
    keys?: string[];
    /** Separator shown between chord keys. Defaults to "+". */
    separator?: string;
    children?: Snippet;
  }

  let { keys, separator = "+", children }: Props = $props();
</script>

{#if keys && keys.length}
  <kbd class="kbd kbd--chord">
    {#each keys as key, i (i)}
      {#if i > 0}<span class="kbd__sep" aria-hidden="true">{separator}</span>{/if}
      <kbd class="kbd__key">{key}</kbd>
    {/each}
  </kbd>
{:else}
  <kbd class="kbd kbd__key">{@render children?.()}</kbd>
{/if}

<style>
  .kbd {
    font-family: var(
      --iui-kbd-font,
      var(
        --iui-font-mono,
        SFMono-Regular,
        Menlo,
        Monaco,
        Consolas,
        "Liberation Mono",
        "Courier New",
        monospace
      )
    );
  }
  .kbd--chord {
    display: inline-flex;
    align-items: center;
    gap: var(--iui-kbd-gap, 0.25rem);
  }
  .kbd__key {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-inline-size: var(--iui-kbd-min-size, 1.5rem);
    padding: var(--iui-kbd-padding, 0.1rem 0.4rem);
    font-size: var(--iui-kbd-font-size, 0.8125em);
    line-height: 1;
    color: var(--iui-kbd-text, var(--iui-components-general-foreground-default, #272727));
    background: var(--iui-kbd-bg, var(--iui-components-general-background-default, #fff));
    border: 1px solid var(--iui-kbd-border, var(--iui-components-general-border-default, #bdbdbd));
    border-radius: var(--iui-kbd-radius, var(--iui-metrics-radius-control, 0.5rem));
    box-shadow: var(
      --iui-kbd-shadow,
      0 1px 0 1px var(--iui-components-general-border-default, #bdbdbd)
    );
  }
  .kbd__sep {
    color: var(--iui-kbd-sep-text, var(--iui-components-general-foreground-secondary, #515151));
  }
</style>
