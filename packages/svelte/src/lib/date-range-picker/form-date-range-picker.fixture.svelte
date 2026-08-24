<script lang="ts">
  import DateRangePicker from "./DateRangePicker.svelte";

  export let start: string | null = null;
  export let end: string | null = null;
  export let disabled = false;
</script>

<form data-testid="form">
  <DateRangePicker label="Stay" startName="from" endName="to" {start} {end} {disabled} />
</form>
