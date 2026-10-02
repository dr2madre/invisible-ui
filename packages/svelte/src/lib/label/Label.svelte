<script lang="ts">
  /**
   * Label — a styled form label associated with a control via `for`. Behaviour
   * (the association and preventing text selection on double-click) comes from
   * the headless label (`@design-system/core`); this layer adds typographic
   * styling and an optional required marker.
   *
   * The label text is `children`. Colors are themeable via `--ds-label-*`.
   */
  import { untrack, type Snippet } from "svelte";
  import { createLabel } from "./create-label";

  interface Props {
    /** Id of the control this labels (sets `for`). */
    for?: string;
    /** Show a required marker (`*`) after the text. */
    required?: boolean;
    children?: Snippet;
  }

  let { for: forControl, required = false, children }: Props = $props();

  // Seeded once from the first props; the effect below follows later ones.
  const { rootAction, sync } = untrack(() => createLabel({ for: forControl }));
  // The machine keeps its own store, so a `for` changed after mount is pushed
  // into it.
  $effect.pre(() => {
    sync({ for: forControl });
  });
</script>

<label class="label" use:rootAction>
  {@render children?.()}
  {#if required}<span class="label__required" aria-hidden="true">*</span>{/if}
</label>

<style>
  .label {
    display: inline-flex;
    align-items: center;
    gap: 0.2em;
    font: inherit;
    font-weight: var(--ds-label-font-weight, 500);
    line-height: var(--ds-line-height-tight, 1.2);
    color: var(--ds-label-color, var(--ds-color-text, #282420));
  }
  .label__required {
    color: var(--ds-label-required-color, var(--ds-color-danger-body-text, #be3b50));
  }
</style>
