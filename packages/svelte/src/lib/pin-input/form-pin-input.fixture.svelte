<script lang="ts">
  import PinInput from "./PinInput.svelte";

  interface Props {
    value?: string;
    name?: string;
    disabled?: boolean;
  }

  let { value = "", name = "code", disabled = false }: Props = $props();
</script>

<form data-testid="form">
  <PinInput label="Verification code" {name} {value} {disabled} length={6} />
</form>
