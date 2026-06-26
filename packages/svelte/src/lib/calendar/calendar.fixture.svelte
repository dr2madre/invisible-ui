<script lang="ts">
  import Calendar, { type CalendarEvent } from "./Calendar.svelte";
  import type { CalendarView } from "./create-calendar";

  export let value: string | null = "2026-06-15";
  export let focusedDate = "2026-06-15";
  export let view: CalendarView = "month";
  export let views: CalendarView[] = ["month"];
  export let min: string | undefined = undefined;
  export let max: string | undefined = undefined;
  export let onValueChange: ((iso: string) => void) | undefined = undefined;

  const events: CalendarEvent[] = [
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
  {events}
  {prices}
  {onValueChange}
  locale="en-US"
/>
