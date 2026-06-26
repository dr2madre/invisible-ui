<script lang="ts">
  import { createToggleButton } from "./create-toggle-button";

  export let pressed = false;
  export let disabled = false;
  export let onPressedChange: ((p: boolean) => void) | undefined = undefined;

  const { rootAction } = createToggleButton({ pressed, disabled, onPressedChange });
</script>

<button use:rootAction>Bold</button>
