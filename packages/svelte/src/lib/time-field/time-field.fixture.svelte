<script lang="ts">
  import TimeField from "./TimeField.svelte";
  import type { HourCycle, TimeValueError } from "./create-time-field";

  export let value: string | null = null;
  export let hourCycle: HourCycle = 24;
  export let withSeconds = false;
  export let disabled = false;
  export let invalid = false;
  export let error: string | undefined = undefined;
  export let onValueChange: ((value: string | null) => void) | undefined = undefined;
  export let onValueCommit: ((value: string | null) => void) | undefined = undefined;
  export let min: string | undefined = undefined;
  export let max: string | undefined = undefined;
  export let onValidationChange: ((error: TimeValueError | null) => void) | undefined = undefined;
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
