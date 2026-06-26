<script lang="ts">
  /**
   * ScrollArea — a scrollable viewport with custom overlay scrollbars. The
   * scrollbar geometry comes from the headless scroll area (`@design-system/core`);
   * this adapter measures the viewport (scroll + ResizeObserver) and supports
   * dragging the thumb. Native scrollbars are hidden but native keyboard/wheel
   * scrolling is preserved (the focusable viewport scrolls with the arrow keys).
   *
   * Put the scrolling content in the default slot. Themeable via
   * `--ds-scroll-area-*`.
   */
  import { createScrollArea, type ScrollOrientation } from "./create-scroll-area";

  /** Which axes scroll. Defaults to `vertical`. */
  export let orientation: ScrollOrientation = "vertical";
  /** Max size of the viewport (the scroll constraint), e.g. `"12rem"`. */
  export let maxHeight = "12rem";
  /** Optional accessible name; makes the viewport a labelled scroll region. */
  export let label: string | undefined = undefined;

  const { vertical, horizontal, viewportAction, thumbAction } = createScrollArea();

  $: showV = orientation === "vertical" || orientation === "both";
  $: showH = orientation === "horizontal" || orientation === "both";
  $: overflowStyle =
    orientation === "horizontal"
      ? "overflow-x:auto;overflow-y:hidden;"
      : orientation === "both"
        ? "overflow:auto;"
        : "overflow-y:auto;overflow-x:hidden;";
</script>

<div class="scroll-area" data-orientation={orientation}>
  <div
    class="scroll-area__viewport"
    use:viewportAction
    tabindex="0"
    role={label ? "region" : undefined}
    aria-label={label}
    style="max-block-size:{maxHeight}; {overflowStyle}"
  >
    <slot />
  </div>

  {#if showV && $vertical.overflow}
    <div class="scroll-area__bar scroll-area__bar--v" aria-hidden="true">
      <div
        class="scroll-area__thumb"
        use:thumbAction={"vertical"}
        style="block-size:{$vertical.sizeFraction *
          100}%; inset-block-start:{$vertical.offsetFraction * 100}%"
      ></div>
    </div>
  {/if}

  {#if showH && $horizontal.overflow}
    <div class="scroll-area__bar scroll-area__bar--h" aria-hidden="true">
      <div
        class="scroll-area__thumb"
        use:thumbAction={"horizontal"}
        style="inline-size:{$horizontal.sizeFraction *
          100}%; inset-inline-start:{$horizontal.offsetFraction * 100}%"
      ></div>
    </div>
  {/if}
</div>

<style>
  .scroll-area {
    position: relative;
    font: inherit;
    color: var(--ds-color-text, #0f172a);
  }
  .scroll-area__viewport {
    max-inline-size: 100%;
    /* Hide native scrollbars; the custom overlay bars are drawn instead. */
    scrollbar-width: none;
  }
  .scroll-area__viewport::-webkit-scrollbar {
    display: none;
  }
  .scroll-area__viewport:focus-visible {
    outline: var(--ds-focus-ring-width, 2px) solid var(--ds-color-focus-ring, #2563eb);
    outline-offset: -2px;
  }

  .scroll-area__bar {
    position: absolute;
    z-index: 1;
    background: var(--ds-scroll-area-track, transparent);
    border-radius: 999px;
  }
  .scroll-area__bar--v {
    inset-block: 2px;
    inset-inline-end: 2px;
    inline-size: var(--ds-scroll-area-size, 0.5rem);
  }
  .scroll-area__bar--h {
    inset-inline: 2px;
    inset-block-end: 2px;
    block-size: var(--ds-scroll-area-size, 0.5rem);
  }
  .scroll-area__thumb {
    position: absolute;
    border-radius: 999px;
    background: var(--ds-scroll-area-thumb, var(--ds-color-border, #cbd5e1));
    cursor: default;
  }
  .scroll-area__thumb:hover {
    background: var(--ds-scroll-area-thumb-hover, var(--ds-color-text-secondary, #94a3b8));
  }
  .scroll-area__bar--v .scroll-area__thumb {
    inline-size: 100%;
  }
  .scroll-area__bar--h .scroll-area__thumb {
    block-size: 100%;
  }
</style>
