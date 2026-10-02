<script lang="ts">
  import Checkbox from "./Checkbox.svelte";

  interface Props {
    checked?: boolean;
    name?: string;
    value?: string;
  }

  let { checked = false, name = "subscribe", value = "yes" }: Props = $props();
</script>

<form data-testid="form">
  <Checkbox label="Subscribe" {name} {value} {checked} />
</form>
