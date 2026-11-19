<script module lang="ts">
  let timeFieldId = 0;
</script>

<script lang="ts">
  /**
   * TimeField — a styled segmented time input (hour : minute [: second] [AM/PM]).
   * Each segment is a `role="spinbutton"` driven by the headless time field
   * (`@invisible-ui/core`): ArrowUp/Down increment/decrement (wrapping),
   * Left/Right move between segments, digits type with auto-advance, Backspace
   * clears, and A/P set the period in 12-hour mode. The value is the canonical
   * 24-hour ISO string (`HH:mm` or `HH:mm:ss`). The hour cycle follows the
   * locale unless `hourCycle` says otherwise. Themeable via `--ds-time-field-*`.
   */
  import {
    createTimeField,
    type HourCycle,
    type TimeSegmentType,
    type TimeValueError,
  } from "./create-time-field";
  import { i18n, timeField as core } from "@invisible-ui/core";
  import { formReset } from "../internal/form-reset";
  import { controllable } from "../internal/controllable.svelte";
  import { getI18n } from "../i18n/create-i18n";
  import { get } from "svelte/store";
  import { untrack } from "svelte";

  const { t, locale } = getI18n();

  interface Props {
    value?: string | null;
    /** 12 or 24 hours. Defaults to the locale's cycle. */
    hourCycle?: HourCycle;
    withSeconds?: boolean;
    disabled?: boolean;
    /** Domain-level invalid state. Structural time errors are detected automatically. */
    invalid?: boolean;
    /** Visible, actionable error text supplied by the application. */
    error?: string;
    /** Accessible label for the whole field. */
    label?: string;
    /** Form field name — the formatted time (`HH:mm[:ss]`) is submitted under it (via a hidden input). */
    name?: string;
    onValueChange?: (value: string | null) => void;
    /** Called when the user finishes editing: focus leaves the field, or Enter. */
    onValueCommit?: (value: string | null) => void;
    /** Earliest acceptable time (`"HH:mm[:ss]"`), inclusive. */
    min?: string;
    /** Latest acceptable time (`"HH:mm[:ss]"`), inclusive. */
    max?: string;
    /** Called when structural validation changes; `null` means no structural error. */
    onValidationChange?: (error: TimeValueError | null) => void;
  }

  let {
    value = $bindable(null),
    hourCycle,
    withSeconds = false,
    disabled = false,
    invalid = false,
    error,
    label,
    name,
    onValueChange,
    onValueCommit,
    min,
    max,
    onValidationChange,
  }: Props = $props();

  const cycle = $derived(hourCycle ?? i18n.hourCycleOf($locale));
  const translate = get(t);
  const id = `ds-time-field-${++timeFieldId}`;
  const errorId = `${id}-error`;
  // Seeded once from the first props; the effect and the mirror below follow
  // later ones.
  const field = untrack(() =>
    createTimeField({
      id,
      value,
      hourCycle: cycle,
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
      // Live callback references (ADR 0011).
      onValueChange: (next) => onValueChange?.(next),
      onValueCommit: (next) => onValueCommit?.(next),
      onValidationChange: (next) => onValidationChange?.(next),
    }),
  );
  const { state: tfState, api, rootAction, segmentAction, fieldAction } = field;

  $effect.pre(() => {
    field.syncConfig({ min, max, hourCycle: cycle, withSeconds });
  });

  // Controllable mirror (ADR 0011), with the reset default of ADR 0012.
  const mirror = controllable({
    get: () => value,
    set: (next) => (value = next),
    reflect: field.syncValue,
    isGiveBack: (next) => next === ($api.value ?? null),
  });

  const segments = $derived(core.segments($tfState.hourCycle, $tfState.withSeconds));
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

  const validationMessage = $derived(error ?? messageFor($api.validationError));
</script>

<div class="time-field-control">
  <div
    class={[
      "time-field",
      disabled && "time-field--disabled",
      (invalid || Boolean(validationMessage)) && "time-field--invalid",
    ]}
    use:rootAction
    use:fieldAction
    use:formReset={mirror.restore}
    aria-label={label ?? $t("timeField.label")}
    aria-disabled={disabled || undefined}
    aria-invalid={invalid || Boolean(validationMessage) || undefined}
    aria-describedby={validationMessage ? errorId : undefined}
  >
    {#if name}
      <input type="hidden" {name} value={$api.value ?? ""} disabled={disabled || undefined} />
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
      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <span
        class={[
          "time-field__segment",
          isEmpty(seg, text) && "time-field__segment--placeholder",
          seg === "dayPeriod" && "time-field__segment--period",
        ]}
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
    color: var(--ds-components-general-foreground-default, #272727);
    background: var(--ds-components-general-background-default, #fff);
    border: 1px solid var(--ds-components-general-border-control, #757575);
    border-radius: var(--ds-metrics-radius-control, 0.5rem);
  }
  .time-field:focus-within {
    border-color: var(--ds-components-general-focus-ring-color, #8e6cd4);
    box-shadow: var(--ds-focus-ring-shadow);
  }
  .time-field--disabled {
    opacity: 0.55;
  }
  .time-field--invalid {
    border-color: var(--ds-components-general-feedback-danger-solid-background-default, #be3b50);
  }

  .time-field__separator {
    color: var(--ds-components-general-foreground-secondary, #515151);
  }
  .time-field__segment {
    padding: 0.05rem 0.2rem;
    border-radius: var(--ds-metrics-radius-control, 0.5rem);
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
    background: var(
      --ds-time-field-focus-bg,
      var(--ds-components-general-selection-background-default, #7a52cc)
    );
    color: var(
      --ds-time-field-focus-text,
      var(--ds-components-general-selection-foreground-default, #ffffff)
    );
  }
  .time-field__segment--placeholder {
    color: var(--ds-components-general-foreground-secondary, #515151);
  }
  .time-field__error {
    margin: 0;
    color: var(--ds-components-general-feedback-danger-solid-background-default, #be3b50);
    font-size: 0.875rem;
  }
</style>
