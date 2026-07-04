<script lang="ts">
  import { createToggleButton } from "./create-toggle-button";

  export let pressed = false;
  export let disabled = false;
  export let onPressedChange: ((p: boolean) => void) | undefined = undefined;

  const { state: tbState, rootAction } = createToggleButton({ pressed, disabled, onPressedChange });
</script>

<label>
  <input use:rootAction checked={$tbState.pressed} aria-label="Bold" />
  <span aria-hidden="true">Bold</span>
</label>
