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

  export let value = "";
  export let length = 6;
  /** Allowed characters. */
  export let type: PinInputType = "numeric";
  /** Render cells masked (like a password). */
  export let mask = false;
  export let disabled = false;
  /** Form field name — the combined code is submitted under it. */
  export let name: string | undefined = undefined;
  /** Accessible name for the group of cells. */
  export let label: string;
  /** Called whenever the combined value changes. */
  export let onValueChange: ((value: string) => void) | undefined = undefined;
  /** Called once all cells are filled. */
  export let onComplete: ((value: string) => void) | undefined = undefined;

  const { rootAction, inputAction, values } = createPinInput({
    value,
    length,
    type,
    mask,
    disabled,
    onValueChange,
    onComplete,
  });

  const cells = Array.from({ length }, (_, i) => i);
</script>

<div class="pin-input" use:rootAction aria-label={label}>
  {#if name}
    <input type="hidden" {name} value={$values.join("")} />
  {/if}
  {#each cells as i (i)}
    <input
      class="pin-input__cell"
      type={mask ? "password" : "text"}
      value={$values[i]}
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
    outline: var(--ds-focus-ring-width, 2px) solid var(--ds-color-focus-ring, #2563eb);
    outline-offset: 1px;
    border-color: var(--ds-color-focus-ring, #2563eb);
  }
  .pin-input__cell[data-disabled] {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
