<script lang="ts">
  import DatePicker from "./DatePicker.svelte";

  export let value: string | null = null;
  export let min: string | undefined = undefined;
  export let max: string | undefined = undefined;
  export let clearable = false;
  export let onValueChange: ((value: string | null) => void) | undefined = undefined;
</script>

<DatePicker {value} {min} {max} {clearable} {onValueChange} locale="en-US" label="Event date" />
