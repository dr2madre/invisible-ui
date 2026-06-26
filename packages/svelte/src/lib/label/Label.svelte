<script lang="ts">
  /**
   * Label — a styled form label associated with a control via `for`. Behaviour
   * (the association and preventing text selection on double-click) comes from
   * the headless label (`@design-system/core`); this layer adds typographic
   * styling and an optional required marker.
   *
   * The label text is the default slot. Colors are themeable via `--ds-label-*`.
   */
  import { createLabel } from "./create-label";

  /** Id of the control this labels (sets `for`). */
  let forControl: string | undefined = undefined;
  export { forControl as for };
  /** Show a required marker (`*`) after the text. */
  export let required = false;

  const { rootAction } = createLabel({ for: forControl });
</script>

<label class="label" use:rootAction>
  <slot />
  {#if required}<span class="label__required" aria-hidden="true">*</span>{/if}
</label>

<style>
  .label {
    display: inline-flex;
    align-items: center;
    gap: 0.2em;
    font: inherit;
    font-weight: var(--ds-label-font-weight, 500);
    color: var(--ds-label-color, var(--ds-color-text, #0f172a));
  }
  .label__required {
    color: var(--ds-label-required-color, var(--ds-color-danger-500, #dc2626));
  }
</style>
