<script>
  import DatePicker from "@nozcadesign/invisible-ui-svelte/DatePicker.svelte";

  let value = $state("2026-06-15");
</script>

<DatePicker
  {value}
  label="Event date"
  clearable
  locale="en-US"
  onValueChange={(v) => (value = v)}
/>
