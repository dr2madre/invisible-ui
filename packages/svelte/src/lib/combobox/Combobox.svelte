<script lang="ts">
  /**
   * Combobox — a styled editable autocomplete (WAI-ARIA editable combobox).
   * Behaviour and accessibility (open/close, arrow navigation,
   * `aria-activedescendant`, selection, Escape) come from the headless combobox
   * (`@design-system/core`); this adapter owns filtering, popup positioning
   * (flip/shift via `@floating-ui/dom`), close-on-outside-pointer and keeping the
   * active option in view. DOM focus stays on the input.
   *
   * Pass `items` ({ value, label?, disabled? }) and an accessible `label`. Typing
   * filters the list; choosing an option fills the input. Themeable via
   * `--ds-combobox-*` (and the shared `--ds-select-*` listbox tokens).
   */
  import { createCombobox, type ComboboxItem } from "./create-combobox";
  import Icon from "../icon/Icon.svelte";
  import { getI18n } from "../i18n/create-i18n";

  const { t } = getI18n();

  /** Accessible name for the control. */
  export let label: string;
  export let items: ComboboxItem[];
  export let value: string | null = null;
  /** Input placeholder. Defaults to the i18n catalog's "Search…". */
  export let placeholder: string | undefined = undefined;
  export let disabled = false;
  /** Clear button accessible name. Defaults to the i18n catalog's "Clear". */
  export let clearLabel: string | undefined = undefined;
  /** Text shown when no option matches. Defaults to the i18n catalog's "No results". */
  export let emptyText: string | undefined = undefined;
  /** Form field name — the selected option's value is submitted under it. */
  export let name: string | undefined = undefined;
  export let onValueChange: ((value: string | null) => void) | undefined = undefined;
  export let onInputValueChange: ((text: string) => void) | undefined = undefined;

  const handleValueChange = (next: string | null) => {
    value = next;
    onValueChange?.(next);
  };
  const handleInputValueChange = (text: string) => {
    onInputValueChange?.(text);
  };

  const initialSelected = items.find((item) => item.value === value);
  const combobox = createCombobox({
    items,
    value,
    inputValue: initialSelected ? (initialSelected.label ?? initialSelected.value) : "",
    disabled,
    onValueChange: handleValueChange,
    onInputValueChange: handleInputValueChange,
  });
  const {
    labelAction,
    controlAction,
    inputAction,
    listboxAction,
    optionAction,
    clearAction,
    items: visible,
    inputValue,
    value: selectedValue,
    open,
    openAll,
    setOpen,
    syncValue,
    syncInputValue,
    setItems,
    setDisabled,
  } = combobox;

  $: resolvedPlaceholder = placeholder ?? $t("combobox.placeholder");
  $: resolvedClearLabel = clearLabel ?? $t("combobox.clear");
  $: resolvedEmptyText = emptyText ?? $t("combobox.empty");

  $: selected = items.find((item) => item.value === value);
  $: selectedInputValue = selected ? (selected.label ?? selected.value) : "";
  $: syncValue(value);
  $: syncInputValue(selectedInputValue);
  $: setItems(items);
  $: setDisabled(disabled);

  // The chevron toggles the list open/closed (showing all options when opened),
  // so a selected value can be changed without clearing it first. iOS Safari can
  // synthesize a duplicate "ghost" click; ignore one that arrives right after the
  // last so the list doesn't open then immediately close.
  let lastToggle = -Infinity;
  function toggle(event: MouseEvent) {
    if (event.timeStamp - lastToggle < 350) return;
    lastToggle = event.timeStamp;
    if ($open) setOpen(false);
    else openAll();
  }
</script>

<div class="combobox">
  {#if name}
    <input type="hidden" {name} value={$selectedValue ?? ""} />
  {/if}
  <!-- svelte-ignore a11y_label_has_associated_control -->
  <label class="combobox__label" use:labelAction>{label}</label>

  <div class="combobox__control" class:combobox__control--disabled={disabled} use:controlAction>
    <span class="combobox__search" aria-hidden="true">
      <Icon size="100%">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </Icon>
    </span>
    <input
      class="combobox__input"
      type="text"
      placeholder={resolvedPlaceholder}
      {disabled}
      value={$inputValue}
      use:inputAction
    />

    <!-- The clear button always occupies its slot (hidden when empty) so the
         input width stays stable instead of jumping as text is typed/cleared. -->
    <button
      class="combobox__clear"
      class:combobox__clear--hidden={!$inputValue || disabled}
      aria-label={resolvedClearLabel}
      tabindex={!$inputValue || disabled ? -1 : 0}
      aria-hidden={!$inputValue || disabled ? "true" : undefined}
      use:clearAction
    >
      <Icon size="100%">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </Icon>
    </button>

    <button
      class="combobox__chevron"
      type="button"
      tabindex="-1"
      aria-label={$open ? "Close options" : "Show options"}
      {disabled}
      on:mousedown|preventDefault
      on:click={toggle}
    >
      <Icon size="100%"><polyline points="6 9 12 15 18 9" /></Icon>
    </button>
  </div>

  <ul class="combobox__listbox" use:listboxAction>
    {#each $visible as item (item.value)}
      <li
        class="combobox__option"
        role="option"
        aria-selected={$selectedValue === item.value}
        use:optionAction={item.value}
      >
        <span class="combobox__check" aria-hidden="true">
          <Icon size="100%" strokeWidth={2.5}><polyline points="20 6 9 17 4 12" /></Icon>
        </span>
        <span class="combobox__option-label">{item.label ?? item.value}</span>
      </li>
    {:else}
      <li class="combobox__empty" role="option" aria-selected="false" aria-disabled="true">
        {resolvedEmptyText}
      </li>
    {/each}
  </ul>
</div>

<style>
  .combobox {
    display: grid;
    gap: var(--ds-combobox-gap, 0.375rem);
    inline-size: var(--ds-combobox-width, 16rem);
    font: inherit;
    color: var(--ds-color-text, #0f172a);
  }

  .combobox__label {
    font-size: 0.875rem;
    font-weight: 600;
  }

  .combobox__control {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    box-sizing: border-box;
    padding-inline-end: 0.5rem;
    border: 1px solid var(--ds-color-border, #cbd5e1);
    border-radius: var(--ds-combobox-radius, var(--ds-radius-control, 0.5rem));
    background: var(--ds-color-background, #fff);
    transition:
      border-color 120ms ease,
      box-shadow 120ms ease;
  }
  .combobox__control:focus-within {
    border-color: var(--ds-color-focus-ring, #2563eb);
    box-shadow: var(--ds-focus-ring-shadow);
  }
  .combobox__control--disabled {
    background: var(--ds-color-disabled, #e2e8f0);
    color: var(--ds-color-text-disabled, #94a3b8);
  }

  .combobox__search {
    display: inline-flex;
    flex: none;
    inline-size: 1.05em;
    block-size: 1.05em;
    margin-inline-start: 0.625rem;
    color: var(--ds-color-text-secondary, #57534e);
  }
  .combobox__input {
    flex: 1;
    min-inline-size: 0;
    padding: var(--ds-combobox-padding, 0.5rem 0.75rem);
    border: 0;
    background: transparent;
    color: inherit;
    font: inherit;
  }
  .combobox__input:focus {
    outline: none;
  }

  .combobox__clear {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    inline-size: 1.25rem;
    block-size: 1.25rem;
    flex: none;
    padding: 0;
    border: 0;
    border-radius: var(--ds-radius-control, 0.5rem);
    background: transparent;
    color: var(--ds-color-text-secondary, #64748b);
    cursor: pointer;
  }
  .combobox__clear:hover {
    color: inherit;
  }
  /* Reserve the clear button's footprint when empty (no layout shift). */
  .combobox__clear--hidden {
    visibility: hidden;
    pointer-events: none;
  }
  .combobox__chevron {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    inline-size: 1.5rem;
    block-size: 1.5rem;
    flex: none;
    touch-action: manipulation;
    /* Breathing room from the clear button. */
    margin-inline-start: 0.25rem;
    padding: 0.2rem;
    border: 0;
    border-radius: var(--ds-radius-control, 0.5rem);
    background: transparent;
    color: var(--ds-color-text-secondary, #64748b);
    cursor: pointer;
    transition:
      background-color 120ms ease,
      color 120ms ease;
  }
  .combobox__chevron:hover:not(:disabled) {
    color: inherit;
    background: var(--ds-state-hover, rgb(0 0 0 / 0.06));
  }
  .combobox__chevron:disabled {
    cursor: not-allowed;
  }

  .combobox__listbox {
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
  .combobox__listbox:global([data-state="closed"]) {
    display: none;
  }

  .combobox__option {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem 0.5rem;
    border-radius: var(--ds-radius-control, 0.5rem);
    cursor: pointer;
    user-select: none;
  }
  .combobox__option:global([data-active]:not([data-state="selected"])) {
    background: var(--ds-state-hover, rgb(0 0 0 / 0.06));
  }
  /* The selected option keeps a faint selection tint. */
  .combobox__option:global([data-state="selected"]) {
    background: color-mix(in srgb, var(--ds-color-selected, #7b52cc) 10%, transparent);
  }
  .combobox__option:global([data-disabled]) {
    color: var(--ds-color-text-disabled, #94a3b8);
    cursor: not-allowed;
  }
  .combobox__check {
    display: inline-flex;
    inline-size: 1rem;
    block-size: 1rem;
    flex: none;
    color: var(--ds-color-selected, #7b52cc);
    visibility: hidden;
  }
  .combobox__option:global([data-state="selected"]) .combobox__check {
    visibility: visible;
  }
  .combobox__option:global([data-state="selected"]) .combobox__option-label {
    font-weight: 600;
  }

  .combobox__empty {
    padding: 0.5rem;
    color: var(--ds-color-text-secondary, #64748b);
    cursor: default;
  }
</style>
