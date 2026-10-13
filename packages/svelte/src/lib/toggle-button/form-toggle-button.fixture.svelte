<script lang="ts">
  import ToggleButton from "./ToggleButton.svelte";

  interface Props {
    pressed?: boolean;
    disabled?: boolean;
    onPressedChange?: (p: boolean) => void;
  }

  let { pressed = false, disabled = false, onPressedChange }: Props = $props();
</script>

<form aria-label="Formatting">
  <ToggleButton {pressed} {disabled} {onPressedChange} name="bold" value="yes" label="Bold">
    B
  </ToggleButton>
  <button type="reset">Reset</button>
</form>
