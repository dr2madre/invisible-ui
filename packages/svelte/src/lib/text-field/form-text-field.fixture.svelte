<script lang="ts">
  import TextField from "./TextField.svelte";

  interface Props {
    value?: string;
    name?: string;
  }

  let { value = "", name = "email" }: Props = $props();
</script>

<form data-testid="form">
  <TextField label="Email" {name} {value} />
</form>
