<script lang="ts">
  import TimeField from "./TimeField.svelte";

  interface Props {
    value?: string | null;
    name?: string;
    disabled?: boolean;
  }

  let { value = null, name = "time", disabled = false }: Props = $props();
</script>

<form data-testid="form">
  <TimeField label="Time" {name} {value} {disabled} />
</form>
