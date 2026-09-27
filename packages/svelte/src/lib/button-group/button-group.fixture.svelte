<script lang="ts">
  import ButtonGroup from "./ButtonGroup.svelte";
  import Button from "../button/Button.svelte";
  import type { Orientation } from "./create-button-group";

  interface Props {
    label?: string;
    orientation?: Orientation;
    attached?: boolean;
  }

  let { label = "Text alignment", orientation = "horizontal", attached = true }: Props = $props();
</script>

<ButtonGroup {label} {orientation} {attached}>
  <Button>Left</Button>
  <Button>Center</Button>
  <Button>Right</Button>
</ButtonGroup>
