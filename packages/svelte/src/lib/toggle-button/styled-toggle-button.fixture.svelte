<script lang="ts">
  import ToggleButton from "./ToggleButton.svelte";

  interface Props {
    pressed?: boolean;
    disabled?: boolean;
    check?: boolean;
    onPressedChange?: (p: boolean) => void;
  }

  let { pressed = false, disabled = false, check = false, onPressedChange }: Props = $props();
</script>

<ToggleButton {pressed} {disabled} {check} {onPressedChange} label="Bold">B</ToggleButton>
