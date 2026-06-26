<script lang="ts">
  import { createCheckbox, type CheckedState } from "./create-checkbox";
  import { indeterminate as indeterminateAction } from "../internal/indeterminate";

  export let checked: CheckedState = false;
  export let disabled = false;
  export let onCheckedChange: ((c: CheckedState) => void) | undefined = undefined;

  const { state: cbState, setChecked } = createCheckbox({ checked, disabled, onCheckedChange });

  function onChange(event: Event) {
    const target = event.currentTarget as HTMLInputElement;
    setChecked(target.indeterminate ? "indeterminate" : target.checked);
  }

  $: dataState =
    $cbState.checked === "indeterminate"
      ? "indeterminate"
      : $cbState.checked
        ? "checked"
        : "unchecked";
</script>

<input
  type="checkbox"
  aria-label="Accept terms"
  {disabled}
  checked={$cbState.checked === true}
  use:indeterminateAction={$cbState.checked === "indeterminate"}
  on:change={onChange}
  data-state={dataState}
/>
