<script lang="ts">
  import DateRangePicker from "./DateRangePicker.svelte";
  import type { CalendarView } from "../calendar/create-calendar";

  interface Props {
    start?: string | null;
    end?: string | null;
    view?: CalendarView;
    clearable?: boolean;
    onChange?: (s: string | null, e: string | null) => void;
    /** When set, the page refuses the chosen range and writes this one instead. */
    putBack?: [string, string] | null;
  }

  let {
    start = null,
    end = null,
    view = "month",
    clearable = false,
    onChange,
    putBack = null,
  }: Props = $props();

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
