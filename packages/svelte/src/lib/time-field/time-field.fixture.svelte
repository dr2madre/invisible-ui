<script lang="ts">
  import TimeField from "./TimeField.svelte";
  import type { HourCycle, TimeValueError } from "./create-time-field";

  interface Props {
    value?: string | null;
    hourCycle?: HourCycle;
    withSeconds?: boolean;
    disabled?: boolean;
    invalid?: boolean;
    error?: string;
    onValueChange?: (value: string | null) => void;
    onValueCommit?: (value: string | null) => void;
    min?: string;
    max?: string;
    onValidationChange?: (error: TimeValueError | null) => void;
  }

  let {
    value = null,
    hourCycle = 24,
    withSeconds = false,
    disabled = false,
    invalid = false,
    error,
    onValueChange,
    onValueCommit,
    min,
    max,
    onValidationChange,
  }: Props = $props();
</script>

<button type="button">before</button>
<TimeField
  {value}
  {hourCycle}
  {withSeconds}
  {disabled}
  {invalid}
  {error}
  {onValueChange}
  {onValueCommit}
  {min}
  {max}
  {onValidationChange}
  label="Start time"
/>
<button type="button">after</button>
