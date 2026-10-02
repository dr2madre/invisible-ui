<script lang="ts">
  /**
   * ButtonGroup — the styled, batteries-included grouping of related action
   * buttons. Semantics (a labelled `role="group"` with an orientation) come from
   * the headless button group (`@design-system/core`); this layer lays the
   * buttons out and, when `attached`, joins them into a single segmented bar by
   * collapsing the inner corners and shared borders.
   *
   * Place styled `Button`s (or any `<button>`) in the default slot. The group
   * holds no selection — each button stays an independent action. Give it an
   * accessible `label`. Spacing is themeable via `--ds-button-group-*`.
   */
  import { untrack, type Snippet } from "svelte";
  import { createButtonGroup, type Orientation } from "./create-button-group";

  interface Props {
    /** Accessible name for the group. */
    label: string;
    orientation?: Orientation;
    /** Visually merge the buttons into one bar (vs. spacing them apart). */
    attached?: boolean;
    /**
     * Cross-axis alignment of the items. Defaults to `center` so a taller sibling
     * (e.g. a Select with a label) never stretches the buttons; use `end` to line
     * buttons up with a labelled control's input row, or `stretch` for equal heights.
     */
    align?: "start" | "center" | "end" | "stretch";
    children?: Snippet;
  }

  let {
    label,
    orientation = "horizontal",
    attached = true,
    align = "center",
    children,
  }: Props = $props();

  const alignItems = {
    start: "flex-start",
    center: "center",
    end: "flex-end",
    stretch: "stretch",
  };

  // Seeded once from the first props; the effect below follows later ones.
  const { rootAction, setState } = untrack(() => createButtonGroup({ label, orientation }));

  // The machine keeps its own store, so props changed after mount are pushed
  // into it.
  $effect.pre(() => {
    setState({ orientation, label });
  });
</script>

<div
  class={[
    "button-group",
    attached && "button-group--attached",
    orientation === "vertical" && "button-group--vertical",
  ]}
  style="align-items: {alignItems[align]};"
  use:rootAction
>
  {@render children?.()}
</div>

<style>
  .button-group {
    display: inline-flex;
    flex-direction: row;
    /* Cross-axis alignment is set inline from the `align` prop (default center). */
  }
  .button-group--vertical {
    flex-direction: column;
  }

  /* Spaced (non-attached): just a gap between buttons. */
  .button-group:not(.button-group--attached) {
    gap: var(--ds-button-group-gap, 0.5rem);
  }

  /* Keep a focused button's ring above its neighbours. */
  .button-group :global(button:focus-visible) {
    position: relative;
    z-index: 1;
  }

  /* Attached: square every control inside (buttons, or composed controls like
     a Select whose trigger button sits inside a wrapper), then re-round only
     the group's outer ends — the group owns the outer corners, whatever the
     children are. */
  .button-group--attached :global(button),
  .button-group--attached :global(select) {
    border-radius: 0;
  }

  /* Horizontal: collapse the shared vertical borders and round the ends. */
  .button-group--attached:not(.button-group--vertical) > :global(*:not(:last-child)) {
    margin-inline-end: -1px;
  }
  .button-group--attached:not(.button-group--vertical) > :global(*:first-child),
  .button-group--attached:not(.button-group--vertical) > :global(*:first-child button),
  .button-group--attached:not(.button-group--vertical) > :global(*:first-child select) {
    border-start-start-radius: var(--ds-radius-control, 0.5rem);
    border-end-start-radius: var(--ds-radius-control, 0.5rem);
  }
  .button-group--attached:not(.button-group--vertical) > :global(*:last-child),
  .button-group--attached:not(.button-group--vertical) > :global(*:last-child button),
  .button-group--attached:not(.button-group--vertical) > :global(*:last-child select) {
    border-start-end-radius: var(--ds-radius-control, 0.5rem);
    border-end-end-radius: var(--ds-radius-control, 0.5rem);
  }

  /* Vertical: collapse the shared horizontal borders and round the ends. */
  .button-group--attached.button-group--vertical > :global(*:not(:last-child)) {
    margin-block-end: -1px;
  }
  .button-group--attached.button-group--vertical > :global(*:first-child),
  .button-group--attached.button-group--vertical > :global(*:first-child button),
  .button-group--attached.button-group--vertical > :global(*:first-child select) {
    border-start-start-radius: var(--ds-radius-control, 0.5rem);
    border-start-end-radius: var(--ds-radius-control, 0.5rem);
  }
  .button-group--attached.button-group--vertical > :global(*:last-child),
  .button-group--attached.button-group--vertical > :global(*:last-child button),
  .button-group--attached.button-group--vertical > :global(*:last-child select) {
    border-end-start-radius: var(--ds-radius-control, 0.5rem);
    border-end-end-radius: var(--ds-radius-control, 0.5rem);
  }
</style>
