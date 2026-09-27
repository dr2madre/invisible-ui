<script lang="ts">
  import Calendar, { type CalendarEvent } from "./Calendar.svelte";
  import type { CalendarView, WeekStart } from "./create-calendar";

  interface Props {
    value?: string | null;
    focusedDate?: string;
    view?: CalendarView;
    views?: CalendarView[];
    min?: string;
    max?: string;
    weekStartsOn?: WeekStart;
    onValueChange?: (iso: string) => void;
    /** When set, the page refuses the chosen day and writes this one instead. */
    putBack?: string | null;
    events?: CalendarEvent[];
  }

  let {
    value = "2026-06-15",
    focusedDate = "2026-06-15",
    view = "month",
    views = ["month"],
    min,
    max,
    weekStartsOn = 1,
    onValueChange,
    putBack = null,
    events = [
      { date: "2026-06-10", label: "Standup", tone: "primary" },
      { date: "2026-06-10", label: "Lunch", tone: "success" },
      { date: "2026-06-18", label: "Review", tone: "warning" },
    ],
  }: Props = $props();

  function handleValueChange(iso: string) {
    onValueChange?.(iso);
    if (putBack) value = putBack;
  }

  const prices: Record<string, string> = {
    "2026-06-12": "€120",
    "2026-06-13": "€90",
  };
</script>

<Calendar
  {value}
  {focusedDate}
  {view}
  {views}
  {min}
  {max}
  {weekStartsOn}
  {events}
  {prices}
  onValueChange={handleValueChange}
  locale="en-US"
/>
