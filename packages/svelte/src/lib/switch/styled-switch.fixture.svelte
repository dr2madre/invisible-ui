<script lang="ts">
  import Switch from "./Switch.svelte";

  interface Props {
    checked?: boolean;
    disabled?: boolean;
    onCheckedChange?: (c: boolean) => void;
  }

  let { checked = false, disabled = false, onCheckedChange }: Props = $props();
</script>

<Switch {checked} {disabled} {onCheckedChange} label="Wi-Fi" />
