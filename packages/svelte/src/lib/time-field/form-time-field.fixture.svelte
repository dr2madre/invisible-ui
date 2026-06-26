<script lang="ts">
  import TimeField from "./TimeField.svelte";

  export let value: string | null = null;
  export let name = "time";
</script>

<form data-testid="form">
  <TimeField label="Time" {name} {value} />
</form>
