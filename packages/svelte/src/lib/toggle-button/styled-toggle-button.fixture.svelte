<script lang="ts">
  import ToggleButton from "./ToggleButton.svelte";

  interface Props {
    pressed?: boolean;
    disabled?: boolean;
    onPressedChange?: (p: boolean) => void;
  }

  let { pressed = false, disabled = false, onPressedChange }: Props = $props();
</script>

<ToggleButton {pressed} {disabled} {onPressedChange} label="Bold">B</ToggleButton>
