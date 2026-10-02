<script lang="ts">
  import { untrack } from "svelte";
  import { createToggleButton } from "./create-toggle-button";

  interface Props {
    pressed?: boolean;
    disabled?: boolean;
    onPressedChange?: (p: boolean) => void;
  }

  let { pressed = false, disabled = false, onPressedChange }: Props = $props();

  const { state: tbState, rootAction } = untrack(() =>
    createToggleButton({ pressed, disabled, onPressedChange }),
  );
</script>

<label>
  <input use:rootAction checked={$tbState.pressed} aria-label="Bold" />
  <span aria-hidden="true">Bold</span>
</label>
