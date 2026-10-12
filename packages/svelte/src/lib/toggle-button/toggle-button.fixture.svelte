<script lang="ts">
  import { untrack } from "svelte";
  import { createToggleButton } from "./create-toggle-button";

  interface Props {
    pressed?: boolean;
    disabled?: boolean;
    onPressedChange?: (p: boolean) => void;
  }

  let { pressed = false, disabled = false, onPressedChange }: Props = $props();

  const { rootAction } = untrack(() => createToggleButton({ pressed, disabled, onPressedChange }));
</script>

<button type="button" use:rootAction>Bold</button>
