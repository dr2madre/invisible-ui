<script lang="ts">
  /**
   * Switch — the styled, batteries-included switch built on a **native**
   * `<input type="checkbox" role="switch">`. The browser provides Space
   * activation, focus and form participation (`name`/`value`); `role="switch"`
   * makes screen readers announce on/off. This layer adds the sliding track and
   * thumb plus the visible label.
   *
   * Prefer this over a checkbox for instant on/off settings. A `label` is
   * required (the control needs an accessible name); pass the default slot to
   * override it with rich content. The native input is wrapped in a `<label>`,
   * so clicking the track or text toggles it. Colors and sizing are themeable
   * CSS custom properties (`--ds-switch-*`).
   */
  import { untrack, type Snippet } from "svelte";
  import { createSwitch } from "./create-switch";
  import { formReset } from "../internal/form-reset";
  import { controllable } from "../internal/controllable.svelte";
  import { getI18n } from "../i18n/create-i18n";

  const { t } = getI18n();

  interface Props {
    /** Accessible, visible label (required). Override with the default slot for rich content. */
    label: string;
    /**
     * Visually hide the label while keeping it as the accessible name. The label
     * text is always required.
     */
    hideLabel?: boolean;
    checked?: boolean;
    disabled?: boolean;
    /** Form field name — the value is submitted under it when on. */
    name?: string;
    /** Value submitted with the form when on. Defaults to the native `"on"`. */
    value?: string;
    /** Mark the control required for native form validation. */
    required?: boolean;
    /** Show ON/OFF text inside the track (a wider, labelled variant). */
    onOff?: boolean;
    /** Text shown in the track when on / off (only with `onOff`). Default to the i18n catalog's "ON" / "OFF". */
    onText?: string;
    offText?: string;
    /** Called whenever the on/off value changes. */
    onCheckedChange?: (c: boolean) => void;
    /** Rich label content, in place of `label`. */
    children?: Snippet;
  }

  let {
    label,
    hideLabel = false,
    checked = $bindable(false),
    disabled = false,
    name,
    value = "on",
    required = false,
    onOff = false,
    onText,
    offText,
    onCheckedChange,
    children,
  }: Props = $props();

  // Seeded once from the first props; the mirror and the effect below follow
  // later ones. A live callback reference, so a swapped callback is honoured
  // (ADR 0011).
  const {
    state: swState,
    setChecked,
    syncChecked,
    syncDisabled,
  } = untrack(() =>
    createSwitch({ checked, disabled, onCheckedChange: (c) => onCheckedChange?.(c) }),
  );

  // Controllable mirror (ADR 0011), with the reset default of ADR 0012.
  const mirror = controllable({
    get: () => checked,
    set: (next) => (checked = next),
    reflect: syncChecked,
    isGiveBack: (next) => next === $swState.checked,
  });
  $effect.pre(() => {
    syncDisabled(disabled);
  });

  const resolvedOnText = $derived(onText ?? $t("switch.on"));
  const resolvedOffText = $derived(offText ?? $t("switch.off"));

  function onChange(event: Event) {
    setChecked((event.currentTarget as HTMLInputElement).checked);
  }
</script>

<label class={["field", disabled && "field--disabled"]}>
  <input
    class="switch__input"
    type="checkbox"
    role="switch"
    {name}
    {value}
    {required}
    {disabled}
    checked={$swState.checked}
    defaultChecked={mirror.defaultValue}
    onchange={onChange}
    use:formReset={mirror.restore}
    data-state={$swState.checked ? "checked" : "unchecked"}
  />
  <span class={["switch", onOff && "switch--onoff"]} aria-hidden="true">
    {#if onOff}
      <span class="switch__on">{resolvedOnText}</span>
      <span class="switch__off">{resolvedOffText}</span>
    {/if}
  </span>
  <span class={["field__label", hideLabel && "field__label--hidden"]}
    >{#if children}{@render children()}{:else}{label}{/if}</span
  >
</label>

<style>
  .field {
    display: inline-flex;
    align-items: center;
    gap: var(--ds-switch-gap, 0.5rem);
    cursor: pointer;
  }
  .field--disabled {
    cursor: not-allowed;
  }
  /* Kept in the accessibility tree (names the control), removed from view. */
  .field__label--hidden {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    margin: -1px;
    padding: 0;
    border: 0;
    overflow: hidden;
    clip: rect(0 0 0 0);
    clip-path: inset(50%);
    white-space: nowrap;
  }
  .field--disabled .field__label {
    color: var(--ds-color-text-disabled, #757067);
  }

  /* The native input is the accessible, focusable control; visually hidden, with
     the sibling `.switch` painted from its :checked / :focus-visible state. */
  .switch__input {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    margin: -1px;
    padding: 0;
    border: 0;
    overflow: hidden;
    clip: rect(0 0 0 0);
    clip-path: inset(50%);
    white-space: nowrap;
  }

  .switch {
    inline-size: var(--ds-switch-width, 2.5rem);
    block-size: var(--ds-switch-height, 1.5rem);
    border-radius: var(--ds-radius-pill, 999px);
    /* The track carries a boundary in both states: it is what makes the
       control visible against the page, and the two states keep the same
       shape. It is drawn inside the track, so no size changes with it. */
    background: var(--ds-color-surface, #e6e0d8);
    box-shadow: inset 0 0 0 1px var(--ds-color-control-border, #757067);
    position: relative;
    flex: none;
    transition: background-color 120ms ease;
  }
  .switch::after {
    content: "";
    position: absolute;
    inset-block-start: 0.125rem;
    inset-inline-start: 0.125rem;
    inline-size: calc(var(--ds-switch-height, 1.5rem) - 0.25rem);
    block-size: calc(var(--ds-switch-height, 1.5rem) - 0.25rem);
    border-radius: 50%;
    /* The thumb is always white (it sits on the track in both states). */
    background: var(--ds-switch-thumb, var(--ds-neutral-0, #ffffff));
    /* A rim in the boundary colour keeps the thumb separable from the light
       off track, where the white alone would disappear. */
    box-shadow: 0 0 0 1px var(--ds-color-control-border, #757067);
    transition: translate 150ms ease;
  }

  .switch__input:checked + .switch {
    background: var(--ds-color-secondary, #7a52cc);
  }
  /* The boundary is repeated here: a second box-shadow would replace it. */
  .switch__input:focus-visible + .switch {
    outline: none;
    box-shadow:
      inset 0 0 0 1px var(--ds-color-control-border, #757067),
      var(--ds-focus-ring-shadow);
    outline-offset: var(--ds-focus-ring-offset, 2px);
  }
  .switch__input:checked + .switch::after {
    translate: calc(var(--ds-switch-width, 2.5rem) - var(--ds-switch-height, 1.5rem)) 0;
  }

  .field--disabled .switch,
  .switch__input:disabled + .switch {
    opacity: 0.5;
  }

  /* ---- ON/OFF labelled variant: a wider track with text behind the thumb ---- */
  .switch--onoff {
    inline-size: var(--ds-switch-onoff-width, 3.75rem);
    display: flex;
    align-items: center;
  }
  .switch--onoff .switch__on,
  .switch--onoff .switch__off {
    position: absolute;
    inset-block: 0;
    display: inline-flex;
    align-items: center;
    font-size: var(--ds-switch-onoff-font, 0.625rem);
    font-weight: 700;
    letter-spacing: 0.04em;
    transition: opacity 120ms ease;
  }
  /* ON sits on the left (revealed when the thumb slides right). */
  .switch--onoff .switch__on {
    inset-inline-start: 0.5rem;
    color: var(--ds-switch-onoff-on-text, var(--ds-color-on-secondary, #fff));
    opacity: 0;
  }
  /* OFF sits on the right (shown while off, thumb on the left). The off track
     is a surface, so the text takes the ordinary text colour: dark in the
     light theme, light in the dark one. */
  .switch--onoff .switch__off {
    inset-inline-end: 0.5rem;
    color: var(--ds-switch-onoff-off-text, var(--ds-color-text, #282420));
    opacity: 1;
  }
  .switch__input:checked + .switch--onoff .switch__on {
    opacity: 1;
  }
  .switch__input:checked + .switch--onoff .switch__off {
    opacity: 0;
  }
  .switch--onoff.switch::after {
    translate: 0 0;
  }
  .switch__input:checked + .switch--onoff.switch::after {
    translate: calc(var(--ds-switch-onoff-width, 3.75rem) - var(--ds-switch-height, 1.5rem)) 0;
  }
  /* Forced colors: the focus sits on the hidden input, so the outline the
     theme forces there lands on something nobody can see. Draw it on the
     visible part instead. */
  @media (forced-colors: active) {
    .switch__input:focus-visible + .switch {
      outline: var(--ds-focus-ring-width, 2px) solid Highlight;
      outline-offset: 2px;
    }
  }
</style>
