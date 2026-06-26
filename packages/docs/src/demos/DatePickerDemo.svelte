<script>
  import DatePicker from "@design-system/svelte/DatePicker.svelte";

  let value = "2026-06-15";
</script>

<DatePicker
  {value}
  label="Event date"
  clearable
  locale="en-US"
  onValueChange={(v) => (value = v)}
/>
