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
  import { untrack } from "svelte";
  import { createPinInput, type PinInputType } from "./create-pin-input";
  import { formReset } from "../internal/form-reset";
  import { controllable } from "../internal/controllable.svelte";
  import { get } from "svelte/store";
  import { getI18n } from "../i18n/create-i18n";

  interface Props {
    value?: string;
    length?: number;
    /** Allowed characters. */
    type?: PinInputType;
    /** Render cells masked (like a password). */
    mask?: boolean;
    disabled?: boolean;
    /** Validation state — colors the cells (red ring) and signals errors. */
    invalid?: boolean;
    /** Validation success — colors the cells green (e.g. a verified code). */
    success?: boolean;
    /** Form field name — the combined code is submitted under it. */
    name?: string;
    /** Accessible name for the group of cells. */
    label: string;
    /** Called whenever the combined value changes. */
    onValueChange?: (value: string) => void;
    /** Called once all cells are filled. */
    onComplete?: (value: string) => void;
  }

  let {
    value = $bindable(""),
    length = 6,
    type = "numeric",
    mask = false,
    disabled = false,
    invalid = false,
    success = false,
    name,
    label,
    onValueChange,
    onComplete,
  }: Props = $props();

  const { t } = getI18n();

  // One name per cell, written into the markup and handed to the core, so the
  // server-rendered cells already carry it.
  const cellLabel = (index: number, count: number) =>
    get(t)("pinInput.cell", { index: index + 1, length: count });

  // Seeded once from the first props, as before: only the value follows later
  // ones. The arrow wrappers read the props at call time, so a callback
  // replaced after mount is the one that gets called.
  const { rootAction, inputAction, values, syncValue } = untrack(() =>
    createPinInput({
      value,
      length,
      type,
      mask,
      disabled,
      cellLabel,
      onValueChange: (next) => onValueChange?.(next),
      onComplete: (next) => onComplete?.(next),
    }),
  );

  // Controllable mirror (ADR 0011), with the reset default of ADR 0012.
  const mirror = controllable({
    get: () => value,
    set: (next) => (value = next),
    reflect: syncValue,
    isGiveBack: (next) => next === $values.join(""),
  });

  // The cell count is read once, like the machine it matches.
  const cells = untrack(() => Array.from({ length }, (_, i) => i));
</script>

<!-- The role is declared here as well as applied by the action, so the
     label on this element is legal before hydration. -->
<div
  class="pin-input"
  role="group"
  use:rootAction
  use:formReset={mirror.restore}
  aria-label={label}
  data-invalid={invalid ? "" : undefined}
  data-success={!invalid && success ? "" : undefined}
>
  {#if name}
    <input type="hidden" {name} value={$values.join("")} disabled={disabled || undefined} />
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
    border: 1px solid var(--ds-color-control-border, #757067);
    border-radius: var(--ds-pin-input-radius, var(--ds-radius-control, 0.5rem));
    background: var(--ds-color-background, #fff);
    color: var(--ds-color-text, #282420);
  }
  .pin-input__cell:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring-shadow);
    outline-offset: 1px;
    border-color: var(--ds-color-focus-ring, #8e6cd4);
  }
  .pin-input__cell:global([data-disabled]) {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Validation states color the cell borders (and ring on focus). */
  .pin-input[data-invalid] .pin-input__cell {
    border-color: var(--ds-color-danger, #be3b50);
  }
  .pin-input[data-invalid] .pin-input__cell:focus-visible {
    border-color: var(--ds-color-danger, #be3b50);
    box-shadow: 0 0 0 var(--ds-focus-ring-width, 2px) var(--ds-color-danger, #be3b50);
  }
  .pin-input[data-success] .pin-input__cell {
    border-color: var(--ds-color-success, #3e7523);
  }
  .pin-input[data-success] .pin-input__cell:focus-visible {
    border-color: var(--ds-color-success, #3e7523);
    box-shadow: 0 0 0 var(--ds-focus-ring-width, 2px) var(--ds-color-success, #3e7523);
  }
</style>
