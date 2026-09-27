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
  import { localDate, type WeekStart } from "../calendar/create-calendar";
  import Icon from "../icon/Icon.svelte";
  import { i18n } from "@design-system/core";
  import { getI18n } from "../i18n/create-i18n";
  import { stableId } from "../internal/stable-id";
  import { formReset } from "../internal/form-reset";
  import { controllable } from "../internal/controllable.svelte";

  const { t, locale: providerLocale } = getI18n();

  interface Props {
    value?: string | null;
    min?: string;
    max?: string;
    weekStartsOn?: WeekStart;
    locale?: string;
    /** Intl date style for the field display. */
    dateStyle?: "full" | "long" | "medium" | "short";
    /** Accessible label for the field (required for a meaningful control). */
    label?: string;
    placeholder?: string;
    disabled?: boolean;
    /** Show a clear button when a date is selected. */
    clearable?: boolean;
    /** Forwarded to the calendar. */
    events?: CalendarEvent[];
    prices?: Record<string, string>;
    /** Form field name — the selected ISO date is submitted under it (via a hidden input). */
    name?: string;
    onValueChange?: (value: string | null) => void;
  }

  let {
    value = $bindable(null),
    min,
    max,
    weekStartsOn = 1,
    locale,
    dateStyle = "medium",
    label,
    placeholder,
    disabled = false,
    clearable = false,
    events = [],
    prices = {},
    name,
    onValueChange,
  }: Props = $props();

  const popover = createPopover({ placement: "bottom-start" });
  const { triggerAction, contentAction, open: isOpen, setOpen } = popover;

  const resolvedLocale = $derived(locale ?? $providerLocale);
  const displayFmt = $derived(i18n.dateTimeFormat(resolvedLocale, { dateStyle }));
  const displayValue = $derived(value ? displayFmt.format(localDate(value)) : "");

  // Controllable mirror (ADR 0011). The prop is the whole state here, and the
  // component's own writes go through `mirror.write`, so every change the
  // mirror sees is the consumer's and moves the reset default (ADR 0012).
  // Putting the default back reports nothing.
  const mirror = controllable({
    get: () => value,
    set: (next) => (value = next),
  });

  const pick = (iso: string) => {
    mirror.write(iso);
    onValueChange?.(iso);
    setOpen(false);
  };

  const clear = () => {
    mirror.write(null);
    onValueChange?.(null);
  };

  // The combobox names the panel it controls; the panel exists only while open.
  const popupId = `${stableId("dsDatePicker")}-popup`;
</script>

<div class={["date-picker", disabled && "date-picker--disabled"]} use:formReset={mirror.restore}>
  {#if name}
    <input type="hidden" {name} value={value ?? ""} disabled={disabled || undefined} />
  {/if}
  <div class="date-picker__field">
    <span class={["date-picker__icon", value && "date-picker__icon--active"]} aria-hidden="true">
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
      aria-controls={popupId}
      aria-expanded={$isOpen}
      use:triggerAction
    />
    {#if clearable && value && !disabled}
      <button
        class="date-picker__clear"
        type="button"
        aria-label={$t("datePicker.clear")}
        onclick={clear}
      >
        <Icon size="0.9rem"
          ><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></Icon
        >
      </button>
    {/if}
  </div>

  {#if $isOpen}
    <div class="date-picker__popover" id={popupId} use:contentAction>
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
    color: var(--ds-color-text, #282420);
  }
  .date-picker__field {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding-inline: 0.6rem;
    background: var(--ds-color-background, #fff);
    border: 1px solid var(--ds-color-control-border, #757067);
    border-radius: var(--ds-radius-control, 0.5rem);
  }
  .date-picker__field:focus-within {
    border-color: var(--ds-color-focus-ring, #8e6cd4);
    box-shadow: var(--ds-focus-ring-shadow);
  }
  .date-picker--disabled .date-picker__field {
    opacity: 0.55;
  }
  .date-picker__icon {
    display: inline-flex;
    color: var(--ds-color-text-secondary, #524c44);
  }
  /* Once a date is picked, the icon adopts the selection color. */
  .date-picker__icon--active {
    color: var(--ds-color-secondary, #7a52cc);
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
    color: var(--ds-color-text-secondary, #524c44);
  }
  .date-picker__input:disabled {
    cursor: not-allowed;
  }
  .date-picker__clear {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    /* The glyph keeps its size; the pressable area is at least 24px square. */
    inline-size: 1.5rem;
    block-size: 1.5rem;
    flex: none;
    padding: 0;
    color: var(--ds-color-text-secondary, #524c44);
    background: none;
    border: 0;
    border-radius: 50%;
    cursor: pointer;
  }
  .date-picker__clear:hover {
    background: var(--ds-color-neutral-surface, #f4f2ef);
  }
  .date-picker__clear:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring-shadow);
    outline-offset: 1px;
  }

  .date-picker__popover {
    position: fixed;
    inset-block-start: 0;
    inset-inline-start: 0;
    z-index: var(--ds-popover-z-index, 100);
    box-sizing: border-box;
    inline-size: max-content;
    max-inline-size: min(92vw, 22rem);
    padding: var(--ds-popover-padding, 0.875rem 1rem);
    background: var(--ds-color-background, #fff);
    border: 1px solid var(--ds-color-border, #c7c1b7);
    border-radius: var(--ds-popover-radius, var(--ds-radius-surface, 0.75rem));
    box-shadow: var(
      --ds-elevation-overlay,
      0 10px 15px -3px rgb(0 0 0 / 0.1),
      0 4px 6px -4px rgb(0 0 0 / 0.1)
    );
  }
</style>
