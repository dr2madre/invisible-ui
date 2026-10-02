<script lang="ts">
  import DatePicker from "./DatePicker.svelte";

  interface Props {
    value?: string | null;
    min?: string;
    max?: string;
    clearable?: boolean;
    onValueChange?: (value: string | null) => void;
    /** When set, the page refuses the chosen date and writes this one instead. */
    putBack?: string | null;
  }

  let {
    value = null,
    min,
    max,
    clearable = false,
    onValueChange,
    putBack = null,
  }: Props = $props();

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
