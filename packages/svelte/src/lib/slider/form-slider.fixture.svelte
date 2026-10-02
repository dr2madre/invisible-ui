<script lang="ts">
  import Slider from "./Slider.svelte";

  interface Props {
    value?: number;
    name?: string;
  }

  let { value = 30, name = "volume" }: Props = $props();
</script>

<form data-testid="form">
  <Slider label="Volume" {name} {value} />
</form>
