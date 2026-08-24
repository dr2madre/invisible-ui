<script lang="ts">
  import TimeField from "./TimeField.svelte";

  export let value: string | null = null;
  export let name = "time";
  export let disabled = false;
</script>

<form data-testid="form">
  <TimeField label="Time" {name} {value} {disabled} />
</form>
