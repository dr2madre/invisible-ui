<script lang="ts">
  /**
   * TimeField — a styled segmented time input (hour : minute [: second] [AM/PM]).
   * Each segment is a `role="spinbutton"` driven by the headless time field
   * (`@design-system/core`): ArrowUp/Down increment/decrement (wrapping),
   * Left/Right move between segments, digits type with auto-advance, Backspace
   * clears, and A/P set the period in 12-hour mode. The value is the canonical
   * 24-hour ISO string (`HH:mm` or `HH:mm:ss`). Themeable via `--ds-time-field-*`.
   */
  import { createTimeField, type HourCycle, type TimeSegmentType } from "./create-time-field";
  import { timeField as core } from "@design-system/core";
  import { getI18n } from "../i18n/create-i18n";

  const { t } = getI18n();

  export let value: string | null = null;
  export let hourCycle: HourCycle = 24;
  export let withSeconds = false;
  export let disabled = false;
  /** Accessible label for the whole field. */
  export let label: string | undefined = undefined;
  /** Form field name — the formatted time (`HH:mm[:ss]`) is submitted under it (via a hidden input). */
  export let name: string | undefined = undefined;
  export let onValueChange: ((value: string | null) => void) | undefined = undefined;

  const field = createTimeField({ value, hourCycle, withSeconds, onValueChange });
  const { state: tfState, api, rootAction, segmentAction } = field;

  $: segments = core.segments($tfState.hourCycle, $tfState.withSeconds);
  const isEmpty = (seg: TimeSegmentType, text: string) =>
    text === "hh" ||
    text === "mm" ||
    text === "ss" ||
    (seg === "dayPeriod" && text === "AM" && $tfState.parts.hour == null);
</script>

<div
  class="time-field"
  class:time-field--disabled={disabled}
  use:rootAction
  aria-label={label ?? $t("timeField.label")}
  aria-disabled={disabled || undefined}
>
  {#if name}
    <input type="hidden" {name} value={$api.value ?? ""} />
  {/if}
  {#each segments as seg, i (seg)}
    {#if i > 0}
      <span class="time-field__separator" aria-hidden="true">{seg === "dayPeriod" ? " " : ":"}</span
      >
    {/if}
    {@const text = $api.getSegmentText(seg)}
    <span
      class="time-field__segment"
      class:time-field__segment--placeholder={isEmpty(seg, text)}
      class:time-field__segment--period={seg === "dayPeriod"}
      use:segmentAction={seg}
      tabindex={disabled ? -1 : 0}
    >
      {text}
    </span>
  {/each}
</div>

<style>
  .time-field {
    display: inline-flex;
    align-items: center;
    gap: 0.05rem;
    padding: 0.4rem 0.6rem;
    font: inherit;
    font-variant-numeric: tabular-nums;
    color: var(--ds-color-text, #0f172a);
    background: var(--ds-color-background, #fff);
    border: 1px solid var(--ds-color-border, #cbd5e1);
    border-radius: var(--ds-radius-control, 0.5rem);
  }
  .time-field:focus-within {
    border-color: var(--ds-color-focus-ring, #2563eb);
    box-shadow: var(--ds-focus-ring-shadow);
  }
  .time-field--disabled {
    opacity: 0.55;
  }

  .time-field__separator {
    color: var(--ds-color-text-secondary, #64748b);
  }
  .time-field__segment {
    padding: 0.05rem 0.2rem;
    border-radius: var(--ds-radius-control, 0.25rem);
    cursor: text;
    outline: none;
    min-inline-size: 1.4em;
    text-align: center;
    white-space: nowrap;
    /* contenteditable, but editing is intercepted — hide the text caret. */
    caret-color: transparent;
  }
  .time-field__segment--period {
    min-inline-size: 2em;
  }
  /* Highlight the active segment on any focus (including touch), so it's always
     clear which part is being edited — `:focus-visible` alone misses touch. */
  .time-field__segment:focus {
    background: var(--ds-time-field-focus-bg, var(--ds-color-secondary, #7b52cc));
    color: var(--ds-time-field-focus-text, #fff);
  }
  .time-field__segment--placeholder {
    color: var(--ds-color-text-secondary, #94a3b8);
  }
</style>
