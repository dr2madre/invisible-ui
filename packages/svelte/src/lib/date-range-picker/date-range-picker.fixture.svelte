<script lang="ts">
  import DateRangePicker from "./DateRangePicker.svelte";
  import type { CalendarView } from "../calendar/create-calendar";

  export let start: string | null = null;
  export let end: string | null = null;
  export let view: CalendarView = "month";
  export let clearable = false;
  export let onChange: ((s: string | null, e: string | null) => void) | undefined = undefined;
</script>

<DateRangePicker {start} {end} {view} {clearable} {onChange} locale="en-US" label="Stay dates" />
