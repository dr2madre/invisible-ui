<script lang="ts">
  import Switch from "./Switch.svelte";

  interface Props {
    checked?: boolean;
    name?: string;
    value?: string;
  }

  let { checked = false, name = "wifi", value = "on" }: Props = $props();
</script>

<form data-testid="form">
  <Switch label="Wi-Fi" {name} {value} {checked} />
</form>
