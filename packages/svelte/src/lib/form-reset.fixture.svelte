<script lang="ts">
  import Slider from "./slider/Slider.svelte";

  // A controlled parent in its plainest form: whatever the slider reports
  // comes straight back down as the prop. Through the callback, not bind:
  // the slider never assigns its own prop, so a binding would carry nothing.
  let value = 30;
</script>

<form data-testid="echo-form">
  <Slider label="F" name="f" {value} onValueChange={(next) => (value = next)} min={0} max={100} />
</form>
