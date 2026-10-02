<script lang="ts">
  import Checkbox from "./Checkbox.svelte";
  import type { CheckedState } from "./create-checkbox";

  interface Props {
    checked?: CheckedState;
    disabled?: boolean;
    onCheckedChange?: (c: CheckedState) => void;
    hideLabel?: boolean;
  }

  let { checked = false, disabled = false, onCheckedChange, hideLabel = false }: Props = $props();
</script>

<Checkbox {checked} {disabled} {onCheckedChange} {hideLabel} label="Accept terms" />
