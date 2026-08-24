<script lang="ts">
  import PinInput from "./PinInput.svelte";

  export let value = "";
  export let name = "code";
  export let disabled = false;
</script>

<form data-testid="form">
  <PinInput label="Verification code" {name} {value} {disabled} length={6} />
</form>
