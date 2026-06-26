<script lang="ts">
  import DatePicker from "./DatePicker.svelte";

  export let value: string | null = null;
  export let name = "due";
</script>

<form data-testid="form">
  <DatePicker label="Due date" {name} {value} />
</form>
