<script lang="ts">
  import DateRangePicker from "./DateRangePicker.svelte";

  interface Props {
    start?: string | null;
    end?: string | null;
    disabled?: boolean;
  }

  let { start = null, end = null, disabled = false }: Props = $props();
</script>

<form data-testid="form">
  <DateRangePicker label="Stay" startName="from" endName="to" {start} {end} {disabled} />
</form>
