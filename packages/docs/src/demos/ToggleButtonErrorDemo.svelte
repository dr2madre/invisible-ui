<script>
  import ToggleButton from "@invisible-ui/svelte/ToggleButton.svelte";
  let pressed = $state(false);
</script>

<!-- The app owns the error: it sets it from the pressed state and clears it. -->
<div class="toggle-button-error-demo">
  <ToggleButton
    {pressed}
    check
    error={pressed ? "" : "Turn on email updates to get the code."}
    onPressedChange={(next) => (pressed = next)}
  >
    Email updates
  </ToggleButton>
</div>

<style>
  .toggle-button-error-demo {
    display: grid;
    justify-items: start;
  }
</style>
