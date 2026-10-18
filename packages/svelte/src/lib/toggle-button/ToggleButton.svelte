<script lang="ts">
  /**
   * ToggleButton — the styled, batteries-included toggle button: an independent
   * on/off control (e.g. Bold in a toolbar), built on a native
   * `<button type="button">` carrying `aria-pressed`. The browser owns the
   * button role, Enter and Space activation and focus; this layer adds the
   * surface and the on/off styling. The accessible name never changes with the
   * state: only `aria-pressed` does.
   *
   * Distinct from a switch: use `Switch` for a settings-style on/off control.
   * The label comes from `children`; provide an explicit `label` when
   * `children` is icon-only so the control still has an accessible name. Pass `name`
   * (and optional `value`) to submit the pressed state with a form: a hidden
   * input sends `name=value` while the button is pressed and enabled. Form
   * participation is provisional until it is decided; the owning form's reset
   * restores the default pressed value without reporting a change. Colors and
   * sizing are themeable CSS custom properties (`--ds-toggle-*`).
   *
   * Set `check` for the filter-chip look: a leading checkmark appears when the
   * button is pressed, making the selection explicit alongside the fill, as a
   * filter chip does. Pairs naturally
   * with `ToggleGroup` for a row of multi-select filter chips.
   */
  import { untrack, type Snippet } from "svelte";
  import { createToggleButton } from "./create-toggle-button";
  import { formReset } from "../internal/form-reset";
  import { controllable } from "../internal/controllable.svelte";
  import { stableId } from "../internal/stable-id";
  import FieldError from "../internal/FieldError.svelte";

  interface Props {
    /**
     * Whether the button is pressed. Controlled: changing it updates the control,
     * so it can reflect external selection state (e.g. a filter chip driven by a
     * list). Pass it once and drive clicks via `onPressedChange` for uncontrolled
     * use — that keeps working too.
     */
    pressed?: boolean;
    disabled?: boolean;
    /**
     * Show a leading checkmark when pressed (the filter-chip look). The check
     * reveals the selected state explicitly, the way a filter chip does.
     */
    check?: boolean;
    /** Accessible name; required when the slot content is icon-only. */
    label?: string;
    /** Form field name: while pressed, submits `value` under it (provisional). */
    name?: string;
    /** Value submitted under `name` when pressed. */
    value?: string;
    /**
     * Error message, shown after the button and announced. The button points
     * at it through `aria-describedby`. The app owns it: a form reset leaves
     * it in place, so the app clears it.
     */
    error?: string;
    /** Called whenever the pressed value changes. */
    onPressedChange?: (p: boolean) => void;
    /** The button's content. */
    children?: Snippet;
  }

  let {
    pressed = $bindable(false),
    disabled = false,
    check = false,
    label,
    name,
    value = "on",
    error,
    onPressedChange,
    children,
  }: Props = $props();

  // Seeded once from the first props; the effect and the mirror below follow
  // later ones. A live callback reference, so a swapped callback is honoured
  // (ADR 0011).
  const {
    state: tbState,
    api,
    syncPressed,
    setDisabled,
    rootAction,
  } = untrack(() =>
    createToggleButton({
      pressed,
      disabled,
      onPressedChange: (next) => onPressedChange?.(next),
    }),
  );
  // The disabled sync runs first: a control re-enabled and pressed in the same
  // update accepts the new pressed value, because a disabled control ignores it.
  $effect.pre(() => {
    setDisabled(disabled);
  });
  // Controllable mirror (ADR 0011), with the reset default of ADR 0012.
  const mirror = controllable({
    get: () => pressed,
    set: (next) => (pressed = next),
    reflect: syncPressed,
    isGiveBack: (next) => next === $tbState.pressed,
  });

  // Provisional form participation: present only while pressed, enabled and
  // named, so the form data matches what a pressed checkbox used to send.
  const hiddenInput = $derived($api.getHiddenInputProps({ name, value }));

  const errorId = `${stableId("ds-toggle-button")}-error`;
</script>

<!-- type, aria-pressed and disabled are written here too, so the server
     markup is already a correct toggle before the action runs. -->
<button
  type="button"
  class="toggle"
  use:rootAction
  use:formReset={mirror.restore}
  aria-pressed={$tbState.pressed}
  disabled={$tbState.disabled}
  aria-label={label}
  aria-describedby={error ? errorId : undefined}
>
  <span class="toggle__surface">
    {#if check && $tbState.pressed}
      <!-- Leading checkmark, shown only when pressed: the explicit
           selected-state mark of a filter chip. -->
      <svg
        class="toggle__check"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
    {/if}
    {@render children?.()}
  </span>
  {#if hiddenInput}
    <input {...hiddenInput} />
  {/if}
</button>
<FieldError id={errorId} {error} />

<style>
  /* `.toggle` is the native <button aria-pressed>; `.toggle__surface` inside
     it is the painted part. */
  .toggle {
    display: inline-flex;
    margin: 0;
    padding: 0;
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    cursor: pointer;
  }
  .toggle:disabled {
    cursor: not-allowed;
  }
  .toggle:focus-visible {
    outline: none;
  }

  .toggle__surface {
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    line-height: 1;
    min-inline-size: var(--ds-toggle-size, 2.25rem);
    block-size: var(--ds-toggle-size, 2.25rem);
    padding: 0 var(--ds-toggle-padding-inline, 0.5rem);
    border: var(--ds-toggle-border-width, 1px) solid
      var(--ds-toggle-border, var(--ds-components-toggle-button-border-default));
    border-radius: var(--ds-toggle-radius, var(--ds-metrics-radius-control, 0.5rem));
    background: var(--ds-toggle-bg, var(--ds-components-general-background-default, #fff));
    color: var(--ds-components-general-foreground-default, #272727);
    transition:
      background-color 120ms ease,
      border-color 120ms ease,
      color 120ms ease;
  }
  .toggle__surface :global(svg) {
    inline-size: var(--ds-toggle-icon-size, 1.15rem);
    block-size: var(--ds-toggle-icon-size, 1.15rem);
  }
  /* Hover defaults to the rest background (no change); a flat toolbar overrides
     it with a subtle state overlay for affordance. */
  .toggle:hover .toggle__surface {
    background: var(
      --ds-toggle-bg-hover,
      var(--ds-toggle-bg, var(--ds-components-general-background-default, #fff))
    );
  }
  .toggle:focus-visible .toggle__surface {
    box-shadow: var(--ds-focus-ring-shadow);
  }
  /* On: a faint selection-colored fill, matching border and selection-color
     content (mirrors the standalone Checkbox: no weight change, which would
     shift width). */
  .toggle[aria-pressed="true"] .toggle__surface {
    background: color-mix(
      in srgb,
      var(--ds-components-general-selection-background-default, #7a52cc) 10%,
      transparent
    );
    color: var(--ds-components-general-selection-background-default, #7a52cc);
    border-color: var(--ds-components-toggle-button-border-selected);
  }
  .toggle:disabled .toggle__surface {
    opacity: 0.5;
  }

  /* Forced colors: the box shadow does not paint, so the ring is an outline
     on the visible part, inside it: the row around it clips. */
  @media (forced-colors: active) {
    .toggle:focus-visible .toggle__surface {
      outline: var(--ds-components-general-focus-ring-width, 2px) solid Highlight;
      outline-offset: -2px;
    }
  }
</style>
