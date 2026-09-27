<script lang="ts">
  import { untrack } from "svelte";
  import { createCheckbox, type CheckedState } from "./create-checkbox";
  import { domProps } from "../internal/dom-props";

  interface Props {
    checked?: CheckedState;
    disabled?: boolean;
    onCheckedChange?: (c: CheckedState) => void;
  }

  let { checked = false, disabled = false, onCheckedChange }: Props = $props();

  const {
    state: cbState,
    api,
    setChecked,
  } = untrack(() => createCheckbox({ checked, disabled, onCheckedChange }));

  function onChange(event: Event) {
    const target = event.currentTarget as HTMLInputElement;
    setChecked(target.indeterminate ? "indeterminate" : target.checked);
  }

  const dataState = $derived(
    $cbState.checked === "indeterminate"
      ? "indeterminate"
      : $cbState.checked
        ? "checked"
        : "unchecked",
  );
</script>

<input
  type="checkbox"
  aria-label="Accept terms"
  {disabled}
  checked={$cbState.checked === true}
  use:domProps={$api.rootDomProps}
  onchange={onChange}
  data-state={dataState}
/>
