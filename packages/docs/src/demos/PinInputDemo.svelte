<script>
  import PinInput from "@design-system/svelte/PinInput.svelte";
  let value = "";
</script>

<PinInput {value} length={4} label="Verification code" onValueChange={(v) => (value = v)} />
