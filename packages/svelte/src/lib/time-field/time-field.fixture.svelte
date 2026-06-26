<script lang="ts">
  import TimeField from "./TimeField.svelte";
  import type { HourCycle } from "./create-time-field";

  export let value: string | null = null;
  export let hourCycle: HourCycle = 24;
  export let withSeconds = false;
  export let disabled = false;
  export let onValueChange: ((value: string | null) => void) | undefined = undefined;
</script>

<TimeField {value} {hourCycle} {withSeconds} {disabled} {onValueChange} label="Start time" />
