<script lang="ts">
  /**
   * DatePicker — a date input that opens a `Calendar` in a popover. Composes the
   * headless popover (`@design-system/core`, via `createPopover`) with the
   * styled `Calendar`: the readonly field is the trigger (click / Enter / Space
   * to open), focus moves into the calendar, picking a day fills the field and
   * closes the popover, and Escape returns focus to the field.
   *
   * The field shows the selected date formatted with `Intl` (`dateStyle`); the
   * value is the ISO `YYYY-MM-DD` string. `min`/`max`, `events` (appointment
   * dots) and `prices` are forwarded to the calendar. Themeable via
   * `--ds-date-picker-*` and the calendar's `--ds-calendar-*`.
   */
  import { createPopover } from "../popover/create-popover";
  import Calendar, { type CalendarEvent } from "../calendar/Calendar.svelte";
  import type { WeekStart } from "../calendar/create-calendar";
  import Icon from "../icon/Icon.svelte";
  import { getI18n } from "../i18n/create-i18n";

  const { t } = getI18n();

  export let value: string | null = null;
  export let min: string | undefined = undefined;
  export let max: string | undefined = undefined;
  export let weekStartsOn: WeekStart = 1;
  export let locale: string | undefined = undefined;
  /** Intl date style for the field display. */
  export let dateStyle: "full" | "long" | "medium" | "short" = "medium";
  /** Accessible label for the field (required for a meaningful control). */
  export let label: string | undefined = undefined;
  export let placeholder: string | undefined = undefined;
  export let disabled = false;
  /** Show a clear button when a date is selected. */
  export let clearable = false;
  /** Forwarded to the calendar. */
  export let events: CalendarEvent[] = [];
  export let prices: Record<string, string> = {};

  /** Form field name — the selected ISO date is submitted under it (via a hidden input). */
  export let name: string | undefined = undefined;
  export let onValueChange: ((value: string | null) => void) | undefined = undefined;

  const popover = createPopover({ placement: "bottom-start" });
  const { triggerAction, contentAction, open: isOpen, setOpen } = popover;

  const dt = (iso: string) => new Date(`${iso}T00:00:00`);
  $: displayFmt = new Intl.DateTimeFormat(locale, { dateStyle });
  $: displayValue = value ? displayFmt.format(dt(value)) : "";

  const pick = (iso: string) => {
    value = iso;
    onValueChange?.(iso);
    setOpen(false);
  };

  const clear = () => {
    value = null;
    onValueChange?.(null);
  };
</script>

<div class="date-picker" class:date-picker--disabled={disabled}>
  {#if name}
    <input type="hidden" {name} value={value ?? ""} />
  {/if}
  <div class="date-picker__field">
    <span class="date-picker__icon" aria-hidden="true">
      <Icon size="1.1rem">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </Icon>
    </span>
    <input
      class="date-picker__input"
      type="text"
      role="combobox"
      readonly
      {disabled}
      aria-label={label ?? $t("datePicker.label")}
      placeholder={placeholder ?? $t("datePicker.placeholder")}
      value={displayValue}
      use:triggerAction
    />
    {#if clearable && value && !disabled}
      <button
        class="date-picker__clear"
        type="button"
        aria-label={$t("datePicker.clear")}
        on:click={clear}
      >
        <Icon size="0.9rem"
          ><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></Icon
        >
      </button>
    {/if}
  </div>

  {#if $isOpen}
    <div class="date-picker__popover" use:contentAction>
      <Calendar
        {value}
        focusedDate={value ?? undefined}
        {min}
        {max}
        {weekStartsOn}
        {locale}
        {events}
        {prices}
        onValueChange={pick}
        label={label ?? $t("datePicker.label")}
      />
    </div>
  {/if}
</div>

<style>
  .date-picker {
    display: inline-flex;
    flex-direction: column;
    font: inherit;
    color: var(--ds-color-text, #0f172a);
  }
  .date-picker__field {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding-inline: 0.6rem;
    background: var(--ds-color-surface, #fff);
    border: 1px solid var(--ds-color-border, #cbd5e1);
    border-radius: var(--ds-radius-control, 0.5rem);
  }
  .date-picker__field:focus-within {
    border-color: var(--ds-color-focus-ring, #2563eb);
    box-shadow: 0 0 0 var(--ds-focus-ring-width, 2px) var(--ds-color-focus-ring, #2563eb);
  }
  .date-picker--disabled .date-picker__field {
    opacity: 0.55;
  }
  .date-picker__icon {
    display: inline-flex;
    color: var(--ds-color-text-secondary, #64748b);
  }
  .date-picker__input {
    flex: 1;
    min-inline-size: 8rem;
    padding-block: 0.5rem;
    font: inherit;
    color: inherit;
    background: none;
    border: 0;
    outline: none;
    cursor: pointer;
  }
  .date-picker__input::placeholder {
    color: var(--ds-color-text-secondary, #94a3b8);
  }
  .date-picker__input:disabled {
    cursor: not-allowed;
  }
  .date-picker__clear {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.2rem;
    color: var(--ds-color-text-secondary, #64748b);
    background: none;
    border: 0;
    border-radius: 50%;
    cursor: pointer;
  }
  .date-picker__clear:hover {
    background: var(--ds-color-neutral-surface, #f1f5f9);
  }
  .date-picker__clear:focus-visible {
    outline: var(--ds-focus-ring-width, 2px) solid var(--ds-color-focus-ring, #2563eb);
    outline-offset: 1px;
  }

  .date-picker__popover {
    position: fixed;
    inset-block-start: 0;
    inset-inline-start: 0;
    z-index: var(--ds-popover-z-index, 50);
    box-sizing: border-box;
    inline-size: max-content;
    max-inline-size: min(92vw, 22rem);
    padding: var(--ds-popover-padding, 0.875rem 1rem);
    background: var(--ds-color-background, #fff);
    border: 1px solid var(--ds-color-border, #cbd5e1);
    border-radius: var(--ds-popover-radius, var(--ds-radius-surface, 0.75rem));
    box-shadow: var(
      --ds-elevation-overlay,
      0 10px 15px -3px rgb(0 0 0 / 0.1),
      0 4px 6px -4px rgb(0 0 0 / 0.1)
    );
  }
</style>
