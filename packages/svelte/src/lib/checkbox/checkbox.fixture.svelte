<script lang="ts">
  import { createCheckbox, type CheckedState } from "./create-checkbox";
  import { domProps } from "../internal/dom-props";

  export let checked: CheckedState = false;
  export let disabled = false;
  export let onCheckedChange: ((c: CheckedState) => void) | undefined = undefined;

  const {
    state: cbState,
    api,
    setChecked,
  } = createCheckbox({ checked, disabled, onCheckedChange });

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
  use:domProps={$api.rootDomProps}
  on:change={onChange}
  data-state={dataState}
/>
