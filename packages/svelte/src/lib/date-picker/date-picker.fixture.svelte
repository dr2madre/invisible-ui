<script lang="ts">
  import DatePicker from "./DatePicker.svelte";

  export let value: string | null = null;
  export let min: string | undefined = undefined;
  export let max: string | undefined = undefined;
  export let clearable = false;
  export let onValueChange: ((value: string | null) => void) | undefined = undefined;
  /** When set, the page refuses the chosen date and writes this one instead. */
  export let putBack: string | null = null;

  function handleValueChange(next: string | null) {
    onValueChange?.(next);
    if (putBack) value = putBack;
  }
</script>

<DatePicker
  {value}
  {min}
  {max}
  {clearable}
  onValueChange={handleValueChange}
  locale="en-US"
  label="Event date"
/>
