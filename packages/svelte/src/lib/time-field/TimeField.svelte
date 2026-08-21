<script context="module" lang="ts">
  let timeFieldId = 0;
</script>

<script lang="ts">
  /**
   * TimeField — a styled segmented time input (hour : minute [: second] [AM/PM]).
   * Each segment is a `role="spinbutton"` driven by the headless time field
   * (`@design-system/core`): ArrowUp/Down increment/decrement (wrapping),
   * Left/Right move between segments, digits type with auto-advance, Backspace
   * clears, and A/P set the period in 12-hour mode. The value is the canonical
   * 24-hour ISO string (`HH:mm` or `HH:mm:ss`). Themeable via `--ds-time-field-*`.
   */
  import {
    createTimeField,
    type HourCycle,
    type TimeSegmentType,
    type TimeValueError,
  } from "./create-time-field";
  import { timeField as core } from "@design-system/core";
  import { getI18n } from "../i18n/create-i18n";
  import { get } from "svelte/store";

  const { t } = getI18n();

  export let value: string | null = null;
  export let hourCycle: HourCycle = 24;
  export let withSeconds = false;
  export let disabled = false;
  /** Domain-level invalid state. Structural time errors are detected automatically. */
  export let invalid = false;
  /** Visible, actionable error text supplied by the application. */
  export let error: string | undefined = undefined;
  /** Accessible label for the whole field. */
  export let label: string | undefined = undefined;
  /** Form field name — the formatted time (`HH:mm[:ss]`) is submitted under it (via a hidden input). */
  export let name: string | undefined = undefined;
  export let onValueChange: ((value: string | null) => void) | undefined = undefined;
  /** Called when the user finishes editing: focus leaves the field, or Enter. */
  export let onValueCommit: ((value: string | null) => void) | undefined = undefined;
  /** Earliest acceptable time (`"HH:mm[:ss]"`), inclusive. */
  export let min: string | undefined = undefined;
  /** Latest acceptable time (`"HH:mm[:ss]"`), inclusive. */
  export let max: string | undefined = undefined;
  /** Called when structural validation changes; `null` means no structural error. */
  export let onValidationChange: ((error: TimeValueError | null) => void) | undefined = undefined;

  const translate = get(t);
  const id = `ds-time-field-${++timeFieldId}`;
  const errorId = `${id}-error`;
  const field = createTimeField({
    id,
    value,
    hourCycle,
    withSeconds,
    min,
    max,
    disabled,
    invalid: invalid || Boolean(error),
    describedBy: errorId,
    messages: {
      hour: translate("timeField.hour"),
      minute: translate("timeField.minute"),
      second: translate("timeField.second"),
      dayPeriod: translate("timeField.dayPeriod"),
      empty: translate("timeField.empty"),
    },
    onValueChange,
    onValueCommit,
    onValidationChange,
  });
  const { state: tfState, api, rootAction, segmentAction, fieldAction } = field;

  $: field.syncConfig({ min, max, hourCycle, withSeconds });

  $: segments = core.segments($tfState.hourCycle, $tfState.withSeconds);
  const isEmpty = (seg: TimeSegmentType, text: string) =>
    text === "hh" ||
    text === "mm" ||
    text === "ss" ||
    (seg === "dayPeriod" && $tfState.parts.dayPeriod == null);

  const messageFor = (validationError: TimeValueError | null) => {
    switch (validationError) {
      case "invalid-format":
        return $t("timeField.invalidFormat");
      case "out-of-range":
        return $t("timeField.outOfRange");
      case "seconds-required":
        return $t("timeField.secondsRequired");
      case "seconds-not-allowed":
        return $t("timeField.secondsNotAllowed");
      case "range-underflow":
        return $t("timeField.rangeUnderflow", { min: min ?? "" });
      case "range-overflow":
        return $t("timeField.rangeOverflow", { max: max ?? "" });
      default:
        return undefined;
    }
  };

  $: validationMessage = error ?? messageFor($api.validationError);
</script>

<div class="time-field-control">
  <div
    class="time-field"
    class:time-field--disabled={disabled}
    class:time-field--invalid={invalid || Boolean(validationMessage)}
    use:rootAction
    use:fieldAction
    aria-label={label ?? $t("timeField.label")}
    aria-disabled={disabled || undefined}
    aria-invalid={invalid || Boolean(validationMessage) || undefined}
    aria-describedby={validationMessage ? errorId : undefined}
  >
    {#if name}
      <input type="hidden" {name} value={$api.value ?? ""} />
    {/if}
    {#each segments as seg, i (seg)}
      {#if i > 0}
        <span class="time-field__separator" aria-hidden="true"
          >{seg === "dayPeriod" ? " " : ":"}</span
        >
      {/if}
      {@const text = $api.getSegmentText(seg)}
      <!-- segmentAction applies role="spinbutton" at runtime, which the
         compiler cannot see in the static markup. -->
      <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
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
  <p id={errorId} class="time-field__error" aria-live="polite" hidden={!validationMessage}>
    {validationMessage ?? ""}
  </p>
</div>

<style>
  .time-field-control {
    display: inline-flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
  .time-field {
    display: inline-flex;
    align-items: center;
    gap: 0.05rem;
    padding: 0.4rem 0.6rem;
    font: inherit;
    font-variant-numeric: tabular-nums;
    color: var(--ds-color-text, #282420);
    background: var(--ds-color-background, #fff);
    border: 1px solid var(--ds-color-control-border, #757067);
    border-radius: var(--ds-radius-control, 0.5rem);
  }
  .time-field:focus-within {
    border-color: var(--ds-color-focus-ring, #8e6cd4);
    box-shadow: var(--ds-focus-ring-shadow);
  }
  .time-field--disabled {
    opacity: 0.55;
  }
  .time-field--invalid {
    border-color: var(--ds-color-danger, #be3b50);
  }

  .time-field__separator {
    color: var(--ds-color-text-secondary, #524c44);
  }
  .time-field__segment {
    padding: 0.05rem 0.2rem;
    border-radius: var(--ds-radius-control, 0.5rem);
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
    background: var(--ds-time-field-focus-bg, var(--ds-color-secondary, #7a52cc));
    color: var(--ds-time-field-focus-text, #fff);
  }
  .time-field__segment--placeholder {
    color: var(--ds-color-text-secondary, #524c44);
  }
  .time-field__error {
    margin: 0;
    color: var(--ds-color-danger, #be3b50);
    font-size: 0.875rem;
  }
</style>
