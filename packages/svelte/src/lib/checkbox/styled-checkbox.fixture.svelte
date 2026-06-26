<script lang="ts">
  import Checkbox from "./Checkbox.svelte";
  import type { CheckedState } from "./create-checkbox";

  export let checked: CheckedState = false;
  export let disabled = false;
  export let onCheckedChange: ((c: CheckedState) => void) | undefined = undefined;
</script>

<Checkbox {checked} {disabled} {onCheckedChange} label="Accept terms" />
