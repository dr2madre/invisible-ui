<script>
  import Calendar from "@design-system/svelte/Calendar.svelte";

  let value = "2026-06-15";

  const events = [
    { date: "2026-06-10", label: "Standup", tone: "primary" },
    { date: "2026-06-10", label: "Lunch & learn", tone: "success" },
    { date: "2026-06-18", label: "Design review", tone: "warning" },
    { date: "2026-06-24", label: "Release", tone: "danger" },
  ];
  const prices = {
    "2026-06-12": "€120",
    "2026-06-13": "€90",
    "2026-06-19": "€150",
  };
</script>

<Calendar
  {value}
  focusedDate="2026-06-15"
  views={["month", "two-month", "week", "day", "year"]}
  {events}
  {prices}
  locale="en-US"
  onValueChange={(v) => (value = v)}
/>
