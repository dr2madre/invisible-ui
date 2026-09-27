<script lang="ts">
  import DatePicker from "./DatePicker.svelte";

  interface Props {
    value?: string | null;
    name?: string;
    disabled?: boolean;
  }

  let { value = null, name = "due", disabled = false }: Props = $props();
</script>

<form data-testid="form">
  <DatePicker label="Due date" {name} {value} {disabled} />
</form>
