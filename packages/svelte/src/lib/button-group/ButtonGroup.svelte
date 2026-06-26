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
  import { createButtonGroup, type Orientation } from "./create-button-group";

  /** Accessible name for the group. */
  export let label: string;
  export let orientation: Orientation = "horizontal";
  /** Visually merge the buttons into one bar (vs. spacing them apart). */
  export let attached = true;

  const { rootAction, setState } = createButtonGroup({ label, orientation });

  $: setState({ orientation, label });
</script>

<div
  class="button-group"
  class:button-group--attached={attached}
  class:button-group--vertical={orientation === "vertical"}
  use:rootAction
>
  <slot />
</div>

<style>
  .button-group {
    display: inline-flex;
    flex-direction: row;
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

  /* Attached: square the inner corners, then re-round only the outer ends. */
  .button-group--attached :global(button) {
    border-radius: 0;
  }

  /* Horizontal: collapse the shared vertical borders and round the ends. */
  .button-group--attached:not(.button-group--vertical) :global(button:not(:last-child)) {
    margin-inline-end: -1px;
  }
  .button-group--attached:not(.button-group--vertical) :global(button:first-child) {
    border-start-start-radius: var(--ds-radius-control, 0.5rem);
    border-end-start-radius: var(--ds-radius-control, 0.5rem);
  }
  .button-group--attached:not(.button-group--vertical) :global(button:last-child) {
    border-start-end-radius: var(--ds-radius-control, 0.5rem);
    border-end-end-radius: var(--ds-radius-control, 0.5rem);
  }

  /* Vertical: collapse the shared horizontal borders and round the ends. */
  .button-group--attached.button-group--vertical :global(button:not(:last-child)) {
    margin-block-end: -1px;
  }
  .button-group--attached.button-group--vertical :global(button:first-child) {
    border-start-start-radius: var(--ds-radius-control, 0.5rem);
    border-start-end-radius: var(--ds-radius-control, 0.5rem);
  }
  .button-group--attached.button-group--vertical :global(button:last-child) {
    border-end-start-radius: var(--ds-radius-control, 0.5rem);
    border-end-end-radius: var(--ds-radius-control, 0.5rem);
  }
</style>
