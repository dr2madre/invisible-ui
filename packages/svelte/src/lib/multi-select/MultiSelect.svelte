<script lang="ts">
  /**
   * MultiSelect — the styled multi-value picker: an editable, labelled input
   * that filters a multiselectable listbox, with the chosen values rendered as
   * removable tags in a labelled list. Behaviour, semantics and state live in
   * `@design-system/core` (a sibling of Combobox: the two public contracts
   * stay separate); this layer adds the tag list, the popup styling and form
   * participation.
   *
   * DOM focus stays on the input; the highlighted option travels through
   * `aria-activedescendant`. Enter adds the active option and keeps the popup
   * open for another choice; a selected option stays listed with
   * `aria-selected="true"`. Every tag has a remove button named
   * "Remove <label>" on an ordinary Tab stop; removing one moves focus to the
   * next remove button, else the previous one, else the input.
   *
   * With `name`, one hidden input per selected value is submitted under the
   * same name, in selection order (`FormData.getAll`). Native `required`
   * validation is not possible over hidden inputs: `required` only exposes
   * `aria-required`, and validation belongs to the application.
   * Themeable via `--ds-multi-select-*`.
   */
  import { tick } from "svelte";
  import { multiSelect as core } from "@design-system/core";
  import Icon from "../icon/Icon.svelte";
  import Tag from "../tag/Tag.svelte";
  import { portal } from "../internal/portal";
  import { getI18n } from "../i18n/create-i18n";
  import { createMultiSelect, type MultiSelectItem } from "./create-multi-select";

  const { t } = getI18n();

  /** Accessible, visible label (required). */
  export let label: string;
  /** Ordered list of all options. */
  export let items: MultiSelectItem[];
  /** The selected values (controlled). Replace the array; do not mutate it. */
  export let values: string[] = [];
  /** Called with the next values after a user action. */
  export let onValuesChange: ((values: string[]) => void) | undefined = undefined;
  export let onInputValueChange: ((text: string) => void) | undefined = undefined;
  export let onOpenChange: ((open: boolean) => void) | undefined = undefined;
  /** Input placeholder. Defaults to the i18n catalog's "Search…". */
  export let placeholder: string | undefined = undefined;
  export let disabled = false;
  /** Review-only: focus works, opening/adding/removing do not. */
  export let readOnly = false;
  /** Cap on additions; never removes existing values. */
  export let max: number | undefined = undefined;
  /** Opt in to Backspace removal from an empty input. */
  export let removeOnBackspace = false;
  /** Form field name; one hidden input per value is submitted under it. */
  export let name: string | undefined = undefined;
  /**
   * Expose `aria-required` on the input. Native constraint validation cannot
   * cover hidden multi-value inputs; validation stays with the application.
   */
  export let required = false;
  /** Empty-result row text. Defaults to the i18n catalog's "No results". */
  export let emptyText: string | undefined = undefined;

  const multiSelect = createMultiSelect({
    items,
    values,
    disabled,
    readOnly,
    max,
    removeOnBackspace,
    // Arrow wrappers read the prop variables at call time, so replacing a
    // callback prop makes the next action call the new one, never a stale one.
    onValuesChange: (next) => onValuesChange?.(next),
    onInputValueChange: (next) => onInputValueChange?.(next),
    onOpenChange: (next) => onOpenChange?.(next),
  });
  const {
    state: msState,
    api,
    values: selectedValues,
    inputValue,
    items: visible,
    controlAction,
    inputAction,
    listboxAction,
    optionAction,
    valuesListAction,
    syncValues,
    setItems,
    setDisabled,
    syncReadOnly,
    syncMax,
    syncRemoveOnBackspace,
  } = multiSelect;

  // Controllable mirrors, compared against the last prop reference: an
  // unrelated rerender must not undo a local interaction, and a sync never
  // calls the consumer's callback.
  let lastValues = values;
  $: if (values !== lastValues) {
    lastValues = values;
    syncValues(values);
  }
  let lastItems = items;
  $: if (items !== lastItems) {
    lastItems = items;
    setItems(items);
  }
  $: setDisabled(disabled);
  $: syncReadOnly(readOnly);
  $: syncMax(max ?? null);
  $: syncRemoveOnBackspace(removeOnBackspace);

  $: resolvedPlaceholder = placeholder ?? $t("multiSelect.placeholder");
  $: resolvedEmptyText = emptyText ?? $t("multiSelect.empty");

  $: inert = disabled || readOnly;

  let listEl: HTMLUListElement | null = null;
  let inputEl: HTMLInputElement | null = null;

  // Removing through a remove button unmounts that button, so focus would
  // fall to the body: move it to the remove button now at the same index
  // (the next one), else the previous one, else the input.
  async function removeAt(value: string, index: number) {
    $api.remove(value);
    await tick();
    const buttons = listEl ? Array.from(listEl.querySelectorAll<HTMLElement>(".tag__remove")) : [];
    const target = buttons[index] ?? buttons[index - 1] ?? inputEl;
    target?.focus();
  }
</script>

<div class="multi-select">
  {#if name}
    {#each $selectedValues as value (value)}
      <input type="hidden" {name} {value} />
    {/each}
  {/if}
  <!-- The ids are declared here as well as applied by the actions, so the
       server-rendered input already has a name and names its popup. -->
  <label class="multi-select__label" for={core.inputId($msState.id)} id={core.labelId($msState.id)}
    >{label}</label
  >

  <div
    class="multi-select__control"
    class:multi-select__control--disabled={disabled}
    class:multi-select__control--readonly={readOnly}
    use:controlAction
  >
    {#if $api.selectedItems.length > 0}
      <ul
        class="multi-select__values"
        id={core.valuesId($msState.id)}
        aria-label={$t("multiSelect.selected")}
        bind:this={listEl}
        use:valuesListAction
      >
        {#each $api.selectedItems as item, index (item.value)}
          <li class="multi-select__value">
            <Tag
              removable={!inert && !item.disabled}
              removeLabel={$t("multiSelect.remove", { name: item.label ?? item.value })}
              onRemove={() => removeAt(item.value, index)}
            >
              {item.label ?? item.value}
            </Tag>
          </li>
        {/each}
      </ul>
    {/if}
    <input
      class="multi-select__input"
      type="text"
      placeholder={resolvedPlaceholder}
      {disabled}
      readonly={readOnly}
      aria-required={required ? "true" : undefined}
      value={$inputValue}
      bind:this={inputEl}
      use:inputAction
    />
  </div>

  <!-- The role is declared here as well as applied by the action: the options
       below carry theirs statically, and a role="option" outside a listbox is
       invalid markup before hydration. -->
  <ul
    class="multi-select__listbox"
    id={core.listboxId($msState.id)}
    role="listbox"
    aria-multiselectable="true"
    aria-labelledby={core.labelId($msState.id)}
    use:portal
    use:listboxAction
  >
    {#each $visible as item (item.value)}
      <li
        class="multi-select__option"
        role="option"
        aria-selected={$api.isSelected(item.value)}
        use:optionAction={item.value}
      >
        <span class="multi-select__check" aria-hidden="true">
          <Icon size="100%" strokeWidth={2.5}><polyline points="20 6 9 17 4 12" /></Icon>
        </span>
        <span class="multi-select__option-label">{item.label ?? item.value}</span>
      </li>
    {:else}
      <li class="multi-select__empty" role="option" aria-selected="false" aria-disabled="true">
        {resolvedEmptyText}
      </li>
    {/each}
  </ul>
</div>

<style>
  .multi-select {
    display: grid;
    gap: var(--ds-multi-select-gap, 0.375rem);
    inline-size: var(--ds-multi-select-width, 100%);
    max-inline-size: var(--ds-multi-select-max-width, 24rem);
    font: inherit;
    color: var(--ds-color-text, #0f172a);
  }
  .multi-select__label {
    font-size: var(--ds-multi-select-label-size, 0.875rem);
    font-weight: 500;
  }
  /* One bordered control holding wrapping tags plus the growing input. */
  .multi-select__control {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.5rem;
    border: 1px solid var(--ds-color-border, #cbd5e1);
    border-radius: var(--ds-radius-control, 0.375rem);
    background: var(--ds-color-background, #fff);
  }
  .multi-select__control:focus-within {
    box-shadow: var(--ds-focus-ring-shadow);
  }
  .multi-select__control--disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .multi-select__control--readonly {
    background: var(--ds-color-neutral-surface, #f8fafc);
  }
  .multi-select__values {
    display: inline-flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    margin: 0;
    padding: 0;
    list-style: none;
    max-inline-size: 100%;
  }
  .multi-select__value {
    display: inline-flex;
    max-inline-size: 100%;
  }
  /* Long labels wrap inside the tag instead of clipping the control. */
  .multi-select__value :global(.tag) {
    white-space: normal;
    overflow-wrap: anywhere;
  }
  /* The remove button keeps a WCAG 2.5.8 target: the padding expands the
     clickable area, the margin cancels the layout shift. */
  .multi-select__value :global(.tag__remove) {
    padding: 0.4rem;
    margin: -0.4rem;
  }
  .multi-select__input {
    flex: 1 1 8ch;
    min-inline-size: 8ch;
    border: 0;
    padding: 0.25rem 0;
    font: inherit;
    color: inherit;
    background: transparent;
  }
  .multi-select__input:focus {
    outline: none;
  }
  .multi-select__input:disabled {
    cursor: not-allowed;
  }

  .multi-select__listbox {
    position: fixed;
    z-index: var(--ds-elevation-overlay, 30);
    margin: 0;
    padding: 0.25rem;
    list-style: none;
    max-block-size: min(18rem, 50vh);
    overflow: auto;
    border: 1px solid var(--ds-color-border, #e2e8f0);
    border-radius: var(--ds-radius-surface, 0.5rem);
    background: var(--ds-color-surface, #fff);
    box-shadow: var(--ds-elevation-shadow, 0 8px 24px rgb(0 0 0 / 0.12));
  }
  .multi-select__listbox:not([data-state="open"]) {
    display: none;
  }
  .multi-select__option {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem 0.5rem;
    border-radius: var(--ds-radius-control, 0.375rem);
    cursor: pointer;
  }
  .multi-select__option:global([data-active]) {
    background: var(--ds-state-hover, rgb(0 0 0 / 0.06));
  }
  .multi-select__option:global([data-disabled]) {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .multi-select__check {
    inline-size: 1em;
    block-size: 1em;
    color: var(--ds-color-selected, #7b52cc);
    visibility: hidden;
    flex: none;
  }
  .multi-select__option:global([data-state="selected"]) .multi-select__check {
    visibility: visible;
  }
  .multi-select__option-label {
    overflow-wrap: anywhere;
  }
  .multi-select__empty {
    padding: 0.4rem 0.5rem;
    color: var(--ds-color-text-secondary, #64748b);
  }
</style>
