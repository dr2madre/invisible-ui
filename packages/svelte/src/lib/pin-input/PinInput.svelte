<script lang="ts">
  /**
   * PinInput — a styled OTP / verification-code input: a row of single-character
   * cells. Behaviour and accessibility (per-cell entry, advance/backspace,
   * arrow movement, paste distribution, character filtering) come from the
   * headless PIN input (`@design-system/core`).
   *
   * Provide a `label` for the group's accessible name. Sizing, colors and radius
   * are themeable via `--ds-pin-input-*`.
   */
  import { createPinInput, type PinInputType } from "./create-pin-input";
  import { get } from "svelte/store";
  import { getI18n } from "../i18n/create-i18n";

  export let value = "";
  export let length = 6;
  /** Allowed characters. */
  export let type: PinInputType = "numeric";
  /** Render cells masked (like a password). */
  export let mask = false;
  export let disabled = false;
  /** Validation state — colors the cells (red ring) and signals errors. */
  export let invalid = false;
  /** Validation success — colors the cells green (e.g. a verified code). */
  export let success = false;
  /** Form field name — the combined code is submitted under it. */
  export let name: string | undefined = undefined;
  /** Accessible name for the group of cells. */
  export let label: string;
  /** Called whenever the combined value changes. */
  export let onValueChange: ((value: string) => void) | undefined = undefined;
  /** Called once all cells are filled. */
  export let onComplete: ((value: string) => void) | undefined = undefined;

  const { t } = getI18n();

  // One name per cell, written into the markup and handed to the core, so the
  // server-rendered cells already carry it.
  const cellLabel = (index: number, count: number) =>
    get(t)("pinInput.cell", { index: index + 1, length: count });

  const { rootAction, inputAction, values } = createPinInput({
    value,
    length,
    type,
    mask,
    disabled,
    cellLabel,
    onValueChange,
    onComplete,
  });

  const cells = Array.from({ length }, (_, i) => i);
</script>

<!-- The role is declared here as well as applied by the action, so the
     label on this element is legal before hydration. -->
<div
  class="pin-input"
  role="group"
  use:rootAction
  aria-label={label}
  data-invalid={invalid ? "" : undefined}
  data-success={!invalid && success ? "" : undefined}
>
  {#if name}
    <input type="hidden" {name} value={$values.join("")} />
  {/if}
  {#each cells as i (i)}
    <input
      class="pin-input__cell"
      type={mask ? "password" : "text"}
      value={$values[i]}
      aria-label={cellLabel(i, length)}
      aria-invalid={invalid ? "true" : undefined}
      use:inputAction={i}
    />
  {/each}
</div>

<style>
  .pin-input {
    display: inline-flex;
    gap: var(--ds-pin-input-gap, 0.5rem);
  }
  .pin-input__cell {
    inline-size: var(--ds-pin-input-size, 2.75rem);
    block-size: var(--ds-pin-input-size, 2.75rem);
    text-align: center;
    font-size: var(--ds-pin-input-font-size, 1.25rem);
    border: 1px solid var(--ds-color-border, #cbd5e1);
    border-radius: var(--ds-pin-input-radius, var(--ds-radius-control, 0.375rem));
    background: var(--ds-color-background, #fff);
    color: var(--ds-color-text, #0f172a);
  }
  .pin-input__cell:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring-shadow);
    outline-offset: 1px;
    border-color: var(--ds-color-focus-ring, #2563eb);
  }
  .pin-input__cell:global([data-disabled]) {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Validation states color the cell borders (and ring on focus). */
  .pin-input[data-invalid] .pin-input__cell {
    border-color: var(--ds-color-danger, #dc2626);
  }
  .pin-input[data-invalid] .pin-input__cell:focus-visible {
    border-color: var(--ds-color-danger, #dc2626);
    box-shadow: 0 0 0 var(--ds-focus-ring-width, 2px) var(--ds-color-danger, #dc2626);
  }
  .pin-input[data-success] .pin-input__cell {
    border-color: var(--ds-color-success, #16a34a);
  }
  .pin-input[data-success] .pin-input__cell:focus-visible {
    border-color: var(--ds-color-success, #16a34a);
    box-shadow: 0 0 0 var(--ds-focus-ring-width, 2px) var(--ds-color-success, #16a34a);
  }
</style>
