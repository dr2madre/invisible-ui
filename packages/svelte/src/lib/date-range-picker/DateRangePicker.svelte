<script lang="ts">
  /**
   * DateRangePicker — a field that opens a range `Calendar` in a popover.
   * Composes the headless popover (`createPopover`) with `Calendar` in
   * `mode="range"`: the first click sets the start, the next sets the end (days
   * between are banded); once both are chosen the popover closes. The field
   * shows the range Intl-formatted; the value is two ISO `YYYY-MM-DD` strings.
   *
   * `min`/`max`, `events` and `prices` forward to the calendar; defaults to the
   * two-month view (handy for ranges). Themeable via `--ds-date-picker-*` and
   * the calendar's `--ds-calendar-*`.
   */
  import { createPopover } from "../popover/create-popover";
  import Calendar, { type CalendarEvent } from "../calendar/Calendar.svelte";
  import { localDate, type CalendarView, type WeekStart } from "../calendar/create-calendar";
  import Icon from "../icon/Icon.svelte";
  import { i18n } from "@design-system/core";
  import { getI18n } from "../i18n/create-i18n";
  import { stableId } from "../internal/stable-id";
  import { formReset } from "../internal/form-reset";
  import { controllable } from "../internal/controllable.svelte";

  const { t, locale: providerLocale } = getI18n();

  interface Props {
    start?: string | null;
    end?: string | null;
    min?: string;
    max?: string;
    weekStartsOn?: WeekStart;
    locale?: string;
    dateStyle?: "full" | "long" | "medium" | "short";
    /** Calendar view inside the popover. Defaults to two months side by side. */
    view?: CalendarView;
    label?: string;
    placeholder?: string;
    disabled?: boolean;
    clearable?: boolean;
    events?: CalendarEvent[];
    prices?: Record<string, string>;
    /** Form field name for the start date (submitted as an ISO value via a hidden input). */
    startName?: string;
    /** Form field name for the end date (submitted as an ISO value via a hidden input). */
    endName?: string;
    onChange?: (start: string | null, end: string | null) => void;
  }

  let {
    start = $bindable(null),
    end = $bindable(null),
    min,
    max,
    weekStartsOn = 1,
    locale,
    dateStyle = "medium",
    view = "two-month",
    label,
    placeholder,
    disabled = false,
    clearable = false,
    events = [],
    prices = {},
    startName,
    endName,
    onChange,
  }: Props = $props();

  const popover = createPopover({ placement: "bottom-start" });
  const { triggerAction, contentAction, open: isOpen, setOpen } = popover;

  const resolvedLocale = $derived(locale ?? $providerLocale);
  const displayFmt = $derived(i18n.dateTimeFormat(resolvedLocale, { dateStyle }));
  const displayValue = $derived(
    start && end
      ? displayFmt.formatRange(localDate(start), localDate(end))
      : start
        ? `${displayFmt.format(localDate(start))} – …`
        : "",
  );

  // Controllable mirrors (ADR 0011). The props are the whole state here, and
  // the component's own writes go through `write`, so every change a mirror
  // sees is the consumer's and moves the reset default (ADR 0012). Putting
  // the defaults back reports nothing.
  const startMirror = controllable({
    get: () => start,
    set: (next) => (start = next),
  });
  const endMirror = controllable({
    get: () => end,
    set: (next) => (end = next),
  });

  const handleRange = (s: string | null, e: string | null) => {
    startMirror.write(s);
    endMirror.write(e);
    onChange?.(s, e);
    if (s && e) setOpen(false);
  };

  const clear = () => {
    startMirror.write(null);
    endMirror.write(null);
    onChange?.(null, null);
  };

  const restore = () => {
    startMirror.restore();
    endMirror.restore();
  };

  // The combobox names the panel it controls; the panel exists only while open.
  const popupId = `${stableId("dsDateRangePicker")}-popup`;
</script>

<div class={["date-picker", disabled && "date-picker--disabled"]} use:formReset={restore}>
  {#if startName}
    <input type="hidden" name={startName} value={start ?? ""} disabled={disabled || undefined} />
  {/if}
  {#if endName}
    <input type="hidden" name={endName} value={end ?? ""} disabled={disabled || undefined} />
  {/if}
  <div class="date-picker__field">
    <span
      class={["date-picker__icon", (start || end) && "date-picker__icon--active"]}
      aria-hidden="true"
    >
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
      aria-label={label ?? $t("dateRangePicker.label")}
      placeholder={placeholder ?? $t("dateRangePicker.placeholder")}
      value={displayValue}
      aria-controls={popupId}
      aria-expanded={$isOpen}
      use:triggerAction
    />
    {#if clearable && start && !disabled}
      <button
        class="date-picker__clear"
        type="button"
        aria-label={$t("dateRangePicker.clear")}
        onclick={clear}
      >
        <Icon size="0.9rem"
          ><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></Icon
        >
      </button>
    {/if}
  </div>

  {#if $isOpen}
    <div class="date-picker__popover date-picker__popover--wide" id={popupId} use:contentAction>
      <Calendar
        mode="range"
        rangeStart={start}
        rangeEnd={end}
        focusedDate={start ?? undefined}
        {view}
        {min}
        {max}
        {weekStartsOn}
        {locale}
        {events}
        {prices}
        onRangeChange={handleRange}
        label={label ?? $t("dateRangePicker.label")}
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
  /* Once a range is set, the icon adopts the selection color (like DatePicker). */
  .date-picker__icon--active {
    color: var(--ds-color-secondary, #7a52cc);
  }
  .date-picker__input {
    flex: 1;
    min-inline-size: 12rem;
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
    padding: 0.2rem;
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
    max-inline-size: min(94vw, 40rem);
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
