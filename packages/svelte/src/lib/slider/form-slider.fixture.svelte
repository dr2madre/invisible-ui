<script lang="ts">
  import Slider from "./Slider.svelte";

  export let value = 30;
  export let name = "volume";
</script>

<form data-testid="form">
  <Slider label="Volume" {name} {value} />
</form>
