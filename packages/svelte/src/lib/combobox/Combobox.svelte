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
  import { untrack, type Snippet } from "svelte";
  import { combobox as core } from "@design-system/core";
  import { createCombobox, type ComboboxItem } from "./create-combobox";
  import { formReset } from "../internal/form-reset";
  import { ignoreGhostClicks } from "../internal/ghost-click";
  import { portal } from "../internal/portal";
  import { controllable } from "../internal/controllable.svelte";
  import Icon from "../icon/Icon.svelte";
  import { getI18n } from "../i18n/create-i18n";

  const { t, locale: i18nLocale, dir: i18nDir } = getI18n();

  interface Props {
    /** Accessible name for the control. */
    label: string;
    /**
     * Visually hide the label while keeping it as the accessible name. The label
     * text is always required.
     */
    hideLabel?: boolean;
    /**
     * Options. Each may carry an optional leading `icon` (an SVG path `d`
     * string) shown before the label; with the search hidden, the control
     * mirrors the selected option's icon.
     */
    items: (ComboboxItem & { icon?: string })[];
    value?: string | null;
    /**
     * With `searchable={false}` the text input becomes read-only and the list
     * always shows every option — a select-only combobox: the advanced Select
     * (styled popup, per-option icons) without the autocomplete.
     */
    searchable?: boolean;
    /**
     * Width behaviour: `fixed` (default) uses `--ds-combobox-width` (16rem),
     * `wrap` fits the longest option, `fill` takes 100% of the container.
     */
    width?: "wrap" | "fill" | "fixed";
    /** Input placeholder. Defaults to the i18n catalog's "Search…". */
    placeholder?: string;
    disabled?: boolean;
    /** Clear button accessible name. Defaults to the i18n catalog's "Clear". */
    clearLabel?: string;
    /** Text shown when no option matches. Defaults to the i18n catalog's "No results". */
    emptyText?: string;
    /** Form field name — the selected option's value is submitted under it. */
    name?: string;
    onValueChange?: (value: string | null) => void;
    onInputValueChange?: (text: string) => void;
    /**
     * Leading icon of a select-only combobox (`searchable={false}`). Defaults
     * to the selected option's icon.
     */
    icon?: Snippet;
  }

  let {
    label,
    hideLabel = false,
    items,
    value = $bindable(null),
    searchable = true,
    width = "fixed",
    placeholder,
    disabled = false,
    clearLabel,
    emptyText,
    name,
    onValueChange,
    onInputValueChange,
    icon,
  }: Props = $props();

  // The prop first, then the report (ADR 0011).
  const handleValueChange = (next: string | null) => {
    mirror.write(next);
    onValueChange?.(next);
  };
  const handleInputValueChange = (text: string) => {
    onInputValueChange?.(text);
  };

  // Seeded once from the first props; the mirror and the effects below follow
  // later ones.
  const combobox = untrack(() => {
    const initialSelected = items.find((item) => item.value === value);
    return createCombobox({
      items,
      value,
      inputValue: initialSelected ? (initialSelected.label ?? initialSelected.value) : "",
      disabled,
      // Select-only mode never filters: the read-only input is a trigger, so the
      // list must always show every option (keyboard opening included).
      filter: searchable ? undefined : (all) => all,
      onValueChange: handleValueChange,
      onInputValueChange: handleInputValueChange,
    });
  });
  const {
    state: comboboxState,
    api,
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
    resetValue,
    setItems,
    setDisabled,
  } = combobox;

  const resolvedPlaceholder = $derived(placeholder ?? $t("combobox.placeholder"));
  const resolvedClearLabel = $derived(clearLabel ?? $t("combobox.clear"));
  const resolvedEmptyText = $derived(emptyText ?? $t("combobox.empty"));

  const selected = $derived(items.find((item) => item.value === value));
  const selectedInputValue = $derived(selected ? (selected.label ?? selected.value) : "");
  // The reset default follows the prop, except a give-back of what the
  // control itself reported (ADR 0012).
  const mirror = controllable({
    get: () => value,
    set: (next) => (value = next),
    reflect: syncValue,
    isGiveBack: (next) => next === $selectedValue,
  });
  // The restore puts the control's own copy back beside the machine's, so a
  // later prop change is judged against what the page now shows (ADR 0012).
  const restore = () => {
    const defaultValue = mirror.defaultValue;
    mirror.write(defaultValue);
    resetValue(defaultValue, labelOf(defaultValue));
  };
  const labelOf = (target: string | null) => {
    const match = items.find((item) => item.value === target);
    return match ? (match.label ?? match.value) : "";
  };
  $effect.pre(() => {
    syncInputValue(selectedInputValue);
  });
  $effect.pre(() => {
    setItems(items);
  });
  $effect.pre(() => {
    setDisabled(disabled);
  });
  const iconByValue = $derived(new Map(items.map((item) => [item.value, item.icon])));
  const hasIcons = $derived(items.some((item) => item.icon));

  // The chevron toggles the list open/closed (showing all options when opened),
  // so a selected value can be changed without clearing it first. iOS Safari can
  // synthesize a duplicate "ghost" click; ignore one that arrives right after the
  // last so the list doesn't open then immediately close.
  function ghostClickGuard(node: HTMLElement) {
    return { destroy: ignoreGhostClicks(node) };
  }
  function toggle() {
    if ($open) setOpen(false);
    else openAll();
  }
  // Keeps focus on the input when the chevron is pressed.
  function keepFocus(event: MouseEvent) {
    event.preventDefault();
  }
</script>

<div class="combobox" data-width={width}>
  {#if name}
    <input type="hidden" {name} value={$selectedValue ?? ""} disabled={disabled || undefined} />
  {/if}
  <!-- The ids are declared here as well as applied by the actions, so the
       server-rendered input already has a name and names its popup. -->
  <label
    class={["combobox__label", hideLabel && "combobox__label--hidden"]}
    for={core.inputId($comboboxState.id)}
    id={core.labelId($comboboxState.id)}>{label}</label
  >

  <div class={["combobox__control", disabled && "combobox__control--disabled"]} use:controlAction>
    {#if searchable}
      <span class="combobox__search" aria-hidden="true">
        <Icon size="100%">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </Icon>
      </span>
    {:else if icon || selected?.icon}
      <!-- No search: the leading snippet (or the selected option's icon). -->
      <span class="combobox__search" aria-hidden="true">
        {#if icon}
          {@render icon()}
        {:else if selected?.icon}<Icon size="100%"><path d={selected.icon} /></Icon>{/if}
      </span>
    {/if}
    <input
      class={["combobox__input", !searchable && "combobox__input--select-only"]}
      type="text"
      placeholder={resolvedPlaceholder}
      readonly={!searchable}
      {disabled}
      value={$inputValue}
      use:inputAction
      use:formReset={restore}
    />
    <!-- Invisible sizer: with width="wrap" the longest option (or the
         placeholder) sets a stable control width. -->
    <span class="combobox__sizer" aria-hidden="true">
      {#each items as item (item.value)}<span>{item.label ?? item.value}</span>{/each}
      <span>{resolvedPlaceholder}</span>
    </span>

    <!-- The clear button always occupies its slot (hidden when empty) so the
         input width stays stable instead of jumping as text is typed/cleared. -->
    <button
      class={[
        "combobox__clear",
        $api.clearProps["aria-hidden"] === "true" && "combobox__clear--hidden",
      ]}
      aria-label={resolvedClearLabel}
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
      aria-label={$open ? $t("combobox.hide") : $t("combobox.show")}
      {disabled}
      use:ghostClickGuard
      onmousedown={keepFocus}
      onclick={toggle}
    >
      <Icon size="100%"><polyline points="6 9 12 15 18 9" /></Icon>
    </button>
  </div>

  <!-- The role is declared here as well as applied by the action: the options
       below carry theirs statically, and a role="option" outside a listbox is
       invalid markup before hydration. -->
  <ul
    class="combobox__listbox"
    id={core.listboxId($comboboxState.id)}
    role="listbox"
    aria-labelledby={core.labelId($comboboxState.id)}
    lang={$i18nLocale}
    dir={$i18nDir}
    use:portal
    use:listboxAction
  >
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
        {#if hasIcons}
          {@const optionIcon = iconByValue.get(item.value)}
          <span class="combobox__option-icon" aria-hidden="true">
            {#if optionIcon}
              <Icon size="100%"><path d={optionIcon} /></Icon>
            {/if}
          </span>
        {/if}
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
    /* An auto track grows with its content; a bounded one lets the input
       row shrink with the control on small screens. */
    grid-template-columns: minmax(0, 1fr);
    gap: var(--ds-combobox-gap, 0.375rem);
    inline-size: var(--ds-combobox-width, 16rem);
    max-inline-size: 100%;
    font: inherit;
    color: var(--ds-color-text, #282420);
  }
  .combobox:global([data-width="wrap"]) {
    inline-size: fit-content;
  }
  .combobox:global([data-width="fill"]) {
    inline-size: 100%;
  }

  .combobox__label {
    font-size: 0.875rem;
    font-weight: 600;
  }
  /* Kept in the accessibility tree (names the control), removed from view. */
  .combobox__label--hidden {
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

  .combobox__control {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    box-sizing: border-box;
    padding-inline-end: 0.5rem;
    border: 1px solid var(--ds-color-control-border, #757067);
    border-radius: var(--ds-combobox-radius, var(--ds-radius-control, 0.5rem));
    background: var(--ds-color-background, #fff);
    transition:
      border-color 120ms ease,
      box-shadow 120ms ease;
  }
  .combobox__control:focus-within {
    border-color: var(--ds-color-focus-ring, #8e6cd4);
    box-shadow: var(--ds-focus-ring-shadow);
  }
  .combobox__control--disabled {
    background: var(--ds-color-disabled, #c7c1b7);
    color: var(--ds-color-text-disabled, #757067);
  }

  .combobox__search {
    display: inline-flex;
    flex: none;
    inline-size: 1.05em;
    block-size: 1.05em;
    margin-inline-start: 0.625rem;
    color: var(--ds-color-text-secondary, #524c44);
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
  /* Select-only: the read-only input behaves as a trigger. */
  .combobox__input--select-only {
    cursor: pointer;
    font-weight: 500;
  }
  .combobox__input--select-only::placeholder {
    font-weight: 400;
  }
  /* Zero-height, invisible: contributes only its widest line for width="wrap". */
  .combobox__sizer {
    display: block;
    block-size: 0;
    overflow: hidden;
    visibility: hidden;
    padding-inline: var(--ds-combobox-sizer-padding, 0.75rem);
  }
  .combobox__sizer > span {
    display: block;
    white-space: nowrap;
  }

  .combobox__clear {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    /* The glyph stays small; the pressable area is at least 24px square so
       a finger or an imprecise pointer can hit it. */
    inline-size: 1.5rem;
    block-size: 1.5rem;
    flex: none;
    padding: 0;
    border: 0;
    border-radius: var(--ds-radius-control, 0.5rem);
    background: transparent;
    color: var(--ds-color-text-secondary, #524c44);
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
    color: var(--ds-color-text-secondary, #524c44);
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
    border: 1px solid var(--ds-color-border, #c7c1b7);
    border-radius: var(--ds-select-listbox-radius, var(--ds-radius-surface, 0.75rem));
    box-shadow: var(
      --ds-elevation-overlay,
      0 10px 15px -3px rgb(0 0 0 / 0.1),
      0 4px 6px -4px rgb(0 0 0 / 0.1)
    );
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
    background: color-mix(in srgb, var(--ds-color-selected, #7a52cc) 10%, transparent);
  }
  .combobox__option:global([data-disabled]) {
    color: var(--ds-color-text-disabled, #757067);
    cursor: not-allowed;
  }
  .combobox__check {
    display: inline-flex;
    inline-size: 1rem;
    block-size: 1rem;
    flex: none;
    color: var(--ds-color-selected, #7a52cc);
    visibility: hidden;
  }
  /* Leading per-option icon (reserved width so labels align even when only
     some options carry an icon). */
  .combobox__option-icon {
    display: inline-flex;
    inline-size: var(--ds-combobox-option-icon-size, 1.1rem);
    block-size: var(--ds-combobox-option-icon-size, 1.1rem);
    flex: none;
    color: var(--ds-color-text-secondary, #524c44);
  }
  .combobox__option:global([data-state="selected"]) .combobox__check {
    visibility: visible;
  }
  .combobox__option:global([data-state="selected"]) .combobox__option-label {
    font-weight: 600;
  }

  .combobox__empty {
    padding: 0.5rem;
    color: var(--ds-color-text-secondary, #524c44);
    cursor: default;
  }
  /* Forced colors: the active option is marked by a tint alone, and tints flatten away.
     Keyboard focus stays in the input, so the list must show which
     option it is on. The list scrolls, so the ring goes inside. */
  @media (forced-colors: active) {
    .combobox__option:global([data-active]) {
      outline: var(--ds-focus-ring-width, 2px) solid Highlight;
      outline-offset: -2px;
    }
  }
</style>
