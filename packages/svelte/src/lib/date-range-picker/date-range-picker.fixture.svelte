<script lang="ts">
  import DateRangePicker from "./DateRangePicker.svelte";
  import type { CalendarView } from "../calendar/create-calendar";

  export let start: string | null = null;
  export let end: string | null = null;
  export let view: CalendarView = "month";
  export let clearable = false;
  export let onChange: ((s: string | null, e: string | null) => void) | undefined = undefined;
  /** When set, the page refuses the chosen range and writes this one instead. */
  export let putBack: [string, string] | null = null;

  function handleChange(nextStart: string | null, nextEnd: string | null) {
    onChange?.(nextStart, nextEnd);
    if (putBack) [start, end] = putBack;
  }
</script>

<DateRangePicker
  {start}
  {end}
  {view}
  {clearable}
  onChange={handleChange}
  locale="en-US"
  label="Stay dates"
/>
