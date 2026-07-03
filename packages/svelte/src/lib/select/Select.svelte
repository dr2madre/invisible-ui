<script lang="ts">
  /**
   * Select — the styled, batteries-included single-select dropdown (WAI-ARIA
   * select-only combobox). Behaviour and accessibility (open/close, arrow &
   * Home/End navigation, typeahead, `aria-activedescendant`, selection) come
   * from the headless select (`@design-system/core`); positioning of the popup
   * (flip/shift, stays attached on scroll) is handled by the adapter via
   * `@floating-ui/dom`.
   *
   * Pass `items` ({ value, label?, disabled? }) and an accessible `label`. The
   * trigger shows the selected option's label (or `placeholder`). Colors,
   * radius and elevation are themeable CSS custom properties (`--ds-select-*`).
   */
  import { createSelect, type SelectItem } from "./create-select";
  import Icon from "../icon/Icon.svelte";
  import { getI18n } from "../i18n/create-i18n";

  const { t } = getI18n();

  /** Accessible name for the control. */
  export let label: string;
  /** Visually hide the label (kept for assistive tech) — for compact toolbars. */
  export let hideLabel = false;
  /**
   * Options. Each may carry an optional leading `icon` (an SVG path `d` string)
   * shown to the left of the label; the selection check then sits on the right.
   */
  export let items: (SelectItem & { icon?: string })[];
  export let value: string | null = null;
  /** Trigger text when nothing is selected. Defaults to the i18n catalog's "Select…". */
  export let placeholder: string | undefined = undefined;
  export let disabled = false;
  /** Form field name — the selected value is submitted under it (via a hidden input). */
  export let name: string | undefined = undefined;
  /** Called whenever the selected value changes. */
  export let onValueChange: ((value: string) => void) | undefined = undefined;

  const handleValueChange = (next: string) => {
    value = next;
    onValueChange?.(next);
  };

  const select = createSelect({ items, value, disabled, onValueChange: handleValueChange });
  const {
    labelAction,
    triggerAction,
    listboxAction,
    optionAction,
    value: selectedValue,
    syncValue,
    setItems,
    setDisabled,
  } = select;

  $: syncValue(value);
  $: setItems(items);
  $: setDisabled(disabled);
  $: resolvedPlaceholder = placeholder ?? $t("select.placeholder");
  $: selected = items.find((item) => item.value === $selectedValue);
  $: display = selected ? (selected.label ?? selected.value) : resolvedPlaceholder;
  $: hasIcons = items.some((item) => item.icon);
</script>

<div class="select">
  {#if name}
    <input type="hidden" {name} value={$selectedValue ?? ""} />
  {/if}
  <span class="select__label" class:select__label--hidden={hideLabel} use:labelAction>{label}</span>

  <button
    class="select__trigger"
    class:select__trigger--placeholder={!selected}
    type="button"
    use:triggerAction
  >
    {#if $$slots.icon}
      <span class="select__icon" aria-hidden="true"><slot name="icon" /></span>
    {/if}
    <span class="select__value">{display}</span>
    <span class="select__chevron" aria-hidden="true">
      <Icon size="100%">
        <polyline points="6 9 12 15 18 9" />
      </Icon>
    </span>
  </button>

  <ul class="select__listbox" class:select__listbox--icons={hasIcons} use:listboxAction>
    {#each items as item (item.value)}
      <li class="select__option" use:optionAction={item.value}>
        {#if hasIcons}
          <span class="select__option-icon" aria-hidden="true">
            {#if item.icon}
              <Icon size="100%"><path d={item.icon} /></Icon>
            {/if}
          </span>
        {/if}
        <span class="select__option-label">{item.label ?? item.value}</span>
        <!-- Selection check sits on the right (after the label). -->
        <span class="select__check" aria-hidden="true">
          <Icon size="100%" strokeWidth={2.5}>
            <polyline points="20 6 9 17 4 12" />
          </Icon>
        </span>
      </li>
    {/each}
  </ul>
</div>

<style>
  .select {
    display: grid;
    gap: var(--ds-select-gap, 0.375rem);
    inline-size: var(--ds-select-width, 16rem);
    font: inherit;
    color: var(--ds-color-text, #0f172a);
  }

  .select__label {
    font-size: 0.875rem;
    font-weight: 600;
  }
  .select__label--hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .select__trigger {
    display: inline-flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    inline-size: 100%;
    box-sizing: border-box;
    padding: var(--ds-select-padding, 0.5rem 0.75rem);
    border: 1px solid var(--ds-color-border, #cbd5e1);
    border-radius: var(--ds-select-radius, var(--ds-radius-control, 0.5rem));
    background: var(--ds-color-background, #fff);
    color: inherit;
    font: inherit;
    text-align: start;
    cursor: pointer;
    touch-action: manipulation;
    transition:
      border-color 120ms ease,
      box-shadow 120ms ease;
  }
  .select__trigger:focus-visible {
    outline: none;
    border-color: var(--ds-color-focus-ring, #2563eb);
    box-shadow: var(--ds-focus-ring-shadow);
  }
  .select__trigger--placeholder .select__value {
    color: var(--ds-color-text-secondary, #64748b);
  }
  .select__trigger:global([data-disabled]) {
    background: var(--ds-color-disabled, #e2e8f0);
    color: var(--ds-color-text-disabled, #94a3b8);
    cursor: not-allowed;
  }

  .select__icon {
    display: inline-flex;
    flex: none;
    inline-size: 1.1em;
    block-size: 1.1em;
    color: var(--ds-color-text-secondary, #57534e);
  }
  .select__value {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
  }
  .select__chevron {
    display: inline-flex;
    inline-size: 1.1em;
    block-size: 1.1em;
    flex: none;
    color: var(--ds-color-text-secondary, #64748b);
    transition: rotate 150ms ease;
  }
  .select__trigger:global([data-state="open"]) .select__chevron {
    rotate: 180deg;
  }

  .select__listbox {
    /* Positioned by the adapter (Floating UI) with a fixed strategy. */
    position: fixed;
    inset-block-start: 0;
    inset-inline-start: 0;
    z-index: var(--ds-select-z-index, 50);
    margin: 0;
    padding: var(--ds-select-listbox-padding, 0.25rem);
    list-style: none;
    max-block-size: var(--ds-select-max-height, 16rem);
    overflow-y: auto;
    background: var(--ds-color-background, #fff);
    border: 1px solid var(--ds-color-border, #cbd5e1);
    border-radius: var(--ds-select-listbox-radius, var(--ds-radius-surface, 0.75rem));
    box-shadow: var(--ds-elevation-overlay, 0 10px 15px -3px rgb(0 0 0 / 0.1));
  }
  /* Hidden until opened. */
  .select__listbox:global([data-state="closed"]) {
    display: none;
  }

  .select__option {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem 0.5rem;
    border-radius: var(--ds-radius-control, 0.5rem);
    cursor: pointer;
    user-select: none;
  }
  /* The active (keyboard-highlighted) option — never on the selected one, which
     keeps its own selection tint. */
  .select__option:global([data-active]:not([data-state="selected"])) {
    background: var(--ds-state-hover, rgb(0 0 0 / 0.06));
  }
  .select__option:global([data-disabled]) {
    color: var(--ds-color-text-disabled, #94a3b8);
    cursor: not-allowed;
  }

  /* Leading per-option icon (reserved width so labels align even when only some
     options carry an icon). */
  .select__option-icon {
    display: inline-flex;
    inline-size: 1.1rem;
    block-size: 1.1rem;
    flex: none;
    color: var(--ds-color-text-secondary, #57534e);
  }
  /* Label grows so the check is pushed to the right edge. */
  .select__option-label {
    flex: 1;
    min-inline-size: 0;
  }

  .select__check {
    display: inline-flex;
    inline-size: 1rem;
    block-size: 1rem;
    flex: none;
    color: var(--ds-color-secondary, #7b52cc);
    visibility: hidden;
  }
  .select__option:global([data-state="selected"]) .select__check {
    visibility: visible;
  }
  /* Selected option: a faint selection-color fill (not gray), no bold — the
     check already marks it. */
  .select__option:global([data-state="selected"]) {
    background: color-mix(in srgb, var(--ds-color-secondary, #7b52cc) 10%, transparent);
  }
</style>
