<script>
  import DateRangePicker from "@design-system/svelte/DateRangePicker.svelte";

  let start = "2026-06-10";
  let end = "2026-06-15";
</script>

<DateRangePicker
  {start}
  {end}
  label="Stay dates"
  clearable
  locale="en-US"
  onChange={(s, e) => {
    start = s;
    end = e;
  }}
/>
