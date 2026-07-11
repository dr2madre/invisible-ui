<script lang="ts" context="module">
  let selectCount = 0;
</script>

<script lang="ts">
  /**
   * Select — a styled **native** `<select>`. The browser owns the popup,
   * keyboard, typeahead, form participation and the platform picker on mobile;
   * this layer styles the closed control (`appearance: none` + a custom
   * chevron) and adds label, placeholder, width modes and the invalid state.
   *
   * By design the options are plain text: the native popup can't render
   * markup. If you need per-option icons, rich option content or a styled
   * popup, use the Combobox (optionally with the search hidden) — that is the
   * custom, advanced select.
   *
   * Colors, radius and spacing are themeable via `--ds-select-*`.
   */
  import Icon from "../icon/Icon.svelte";
  import { getI18n } from "../i18n/create-i18n";
  import type { SelectItem } from "./create-select";

  const { t } = getI18n();

  /** Accessible name for the control. */
  export let label: string;
  /** Visually hide the label (kept for assistive tech) — for compact toolbars. */
  export let hideLabel = false;
  /** Options ({ value, label?, disabled? }). Plain text only — see Combobox for rich options. */
  export let items: SelectItem[];
  /** Selected value (bindable). `null` shows the placeholder. */
  export let value: string | null = null;
  /** Shown while nothing is selected. Defaults to the i18n catalog's "Select…". */
  export let placeholder: string | undefined = undefined;
  export let disabled = false;
  /**
   * Width behaviour: `wrap` fits the longest option (the native default),
   * `fill` takes 100% of the container, `fixed` uses `--ds-select-width`
   * (16rem by default).
   */
  export let width: "wrap" | "fill" | "fixed" = "wrap";
  /** Form field name — this is a real `<select>`, so it submits natively. */
  export let name: string | undefined = undefined;
  /** Marks the control as required (native validation + announced to AT). */
  export let required = false;
  /** Error message; when non-empty the select becomes invalid and announces it. */
  export let error: string | undefined = undefined;
  /** Called whenever the selected value changes. */
  export let onValueChange: ((value: string) => void) | undefined = undefined;

  const uid = ++selectCount;
  const selectId = `ds-select-${uid}`;
  const errorId = `ds-select-${uid}-error`;

  $: resolvedPlaceholder = placeholder ?? $t("select.placeholder");
  // The native element always has a selection; `""` stands for "nothing yet"
  // (the hidden, disabled placeholder option) and maps to `value = null`.
  $: nativeValue = value ?? "";

  function onChange(event: Event) {
    const next = (event.currentTarget as HTMLSelectElement).value;
    value = next === "" ? null : next;
    if (value != null) onValueChange?.(value);
  }
</script>

<div class="select" data-width={width}>
  <label class="select__label" class:select__label--hidden={hideLabel} for={selectId}>
    {label}
  </label>

  <span class="select__control">
    <select
      class="select__native"
      class:select__native--placeholder={value == null}
      id={selectId}
      {name}
      {disabled}
      {required}
      aria-invalid={error ? "true" : undefined}
      aria-describedby={error ? errorId : undefined}
      data-invalid={error ? "" : undefined}
      value={nativeValue}
      on:change={onChange}
    >
      <!-- Placeholder: a hidden, disabled option holding the empty value. -->
      <option value="" disabled hidden>{resolvedPlaceholder}</option>
      {#each items as item (item.value)}
        <option value={item.value} disabled={item.disabled}>{item.label ?? item.value}</option>
      {/each}
    </select>
    <span class="select__chevron" aria-hidden="true">
      <Icon size="100%">
        <polyline points="6 9 12 15 18 9" />
      </Icon>
    </span>
  </span>

  {#if error}
    <span class="select__error" id={errorId}>{error}</span>
  {/if}
</div>

<style>
  .select {
    display: grid;
    gap: var(--ds-select-gap, 0.375rem);
    /* wrap (default): the native select already fits its longest option. */
    inline-size: fit-content;
    font: inherit;
    color: var(--ds-color-text, #0f172a);
  }
  .select:global([data-width="fill"]) {
    inline-size: 100%;
  }
  .select:global([data-width="fixed"]) {
    inline-size: var(--ds-select-width, 16rem);
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

  /* Wrapper anchors the custom chevron over the native control. */
  .select__control {
    position: relative;
    display: inline-flex;
    inline-size: 100%;
  }
  .select__native {
    appearance: none;
    inline-size: 100%;
    box-sizing: border-box;
    /* Shared control metrics (same as Button) + room for the chevron. */
    padding: var(
      --ds-select-padding,
      var(--ds-control-padding-y, 0.5rem) var(--ds-control-padding-x, 0.875rem)
    );
    padding-inline-end: calc(var(--ds-control-padding-x, 0.875rem) + 1.6em);
    border: 1px solid var(--ds-color-border, #cbd5e1);
    border-radius: var(--ds-select-radius, var(--ds-radius-control, 0.5rem));
    background: var(--ds-color-background, #fff);
    color: inherit;
    font: inherit;
    line-height: var(--ds-line-height-tight, 1.2);
    /* A set value reads as content (medium, like a Button label). */
    font-weight: 500;
    cursor: pointer;
    transition:
      border-color 120ms ease,
      box-shadow 120ms ease;
  }
  .select__native--placeholder {
    font-weight: 400;
    color: var(--ds-color-text-secondary, #64748b);
  }
  .select__native:focus-visible {
    outline: none;
    border-color: var(--ds-color-focus-ring, #2563eb);
    box-shadow: var(--ds-focus-ring-shadow);
  }
  .select__native:disabled {
    background: var(--ds-color-disabled, #e2e8f0);
    color: var(--ds-color-text-disabled, #94a3b8);
    cursor: not-allowed;
  }
  /* Invalid: danger border on the control, message underneath. */
  .select__native:global([data-invalid]) {
    border-color: var(--ds-color-danger, #dc2626);
  }
  .select__error {
    font-size: 0.8125rem;
    color: var(--ds-color-danger, #dc2626);
  }

  .select__chevron {
    position: absolute;
    inset-block-start: 50%;
    inset-inline-end: var(--ds-control-padding-x, 0.875rem);
    translate: 0 -50%;
    display: inline-flex;
    inline-size: var(--ds-select-icon-size, 1.1em);
    block-size: var(--ds-select-icon-size, 1.1em);
    color: var(--ds-color-text-secondary, #64748b);
    pointer-events: none;
  }
</style>
