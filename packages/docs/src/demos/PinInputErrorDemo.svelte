<script>
  import PinInput from "@invisible-ui/svelte/PinInput.svelte";
  let error = $state("That code is wrong. Check it and try again.");
</script>

<!-- The app owns the error: here a new edit clears it. -->
<div class="pin-input-error-demo">
  <PinInput
    value="0000"
    length={4}
    label="Recovery code"
    {error}
    onValueChange={() => (error = "")}
  />
</div>

<style>
  .pin-input-error-demo {
    display: grid;
    justify-items: start;
  }
</style>
