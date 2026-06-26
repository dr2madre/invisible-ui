<script lang="ts">
  import PinInput from "./PinInput.svelte";

  export let value = "";
  export let name = "code";
</script>

<form data-testid="form">
  <PinInput label="Verification code" {name} {value} length={6} />
</form>
