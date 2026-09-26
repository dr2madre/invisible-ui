<script lang="ts">
  import Calendar, { type CalendarEvent } from "./Calendar.svelte";
  import type { CalendarView, WeekStart } from "./create-calendar";

  export let value: string | null = "2026-06-15";
  export let focusedDate = "2026-06-15";
  export let view: CalendarView = "month";
  export let views: CalendarView[] = ["month"];
  export let min: string | undefined = undefined;
  export let max: string | undefined = undefined;
  export let weekStartsOn: WeekStart = 1;
  export let onValueChange: ((iso: string) => void) | undefined = undefined;
  /** When set, the page refuses the chosen day and writes this one instead. */
  export let putBack: string | null = null;

  function handleValueChange(iso: string) {
    onValueChange?.(iso);
    if (putBack) value = putBack;
  }

  export let events: CalendarEvent[] = [
    { date: "2026-06-10", label: "Standup", tone: "primary" },
    { date: "2026-06-10", label: "Lunch", tone: "success" },
    { date: "2026-06-18", label: "Review", tone: "warning" },
  ];
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
