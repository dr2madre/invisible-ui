<script lang="ts">
  import DatePicker from "./DatePicker.svelte";

  export let value: string | null = null;
  export let name = "due";
  export let disabled = false;
</script>

<form data-testid="form">
  <DatePicker label="Due date" {name} {value} {disabled} />
</form>
