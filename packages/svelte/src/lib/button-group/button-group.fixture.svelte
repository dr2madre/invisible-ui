<script lang="ts">
  import ButtonGroup from "./ButtonGroup.svelte";
  import Button from "../button/Button.svelte";
  import type { Orientation } from "./create-button-group";

  export let label = "Text alignment";
  export let orientation: Orientation = "horizontal";
  export let attached = true;
</script>

<ButtonGroup {label} {orientation} {attached}>
  <Button>Left</Button>
  <Button>Center</Button>
  <Button>Right</Button>
</ButtonGroup>
