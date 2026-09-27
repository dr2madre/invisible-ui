<script lang="ts">
  import { untrack } from "svelte";
  import { createRadioGroup, type RadioItem } from "./create-radio-group";

  interface Props {
    value?: string | null;
    disabled?: boolean;
    items?: RadioItem[];
  }

  let {
    value = null,
    disabled = false,
    items = [{ value: "small" }, { value: "medium" }, { value: "large" }],
  }: Props = $props();

  const {
    state: radioState,
    setValue,
    name,
  } = untrack(() => createRadioGroup({ value, items, disabled }));
</script>

<div role="radiogroup" aria-label="Size">
  {#each items as item (item.value)}
    <label>
      <input
        type="radio"
        {name}
        value={item.value}
        checked={$radioState.value === item.value}
        disabled={disabled || item.disabled}
        onchange={() => setValue(item.value)}
      />
      {item.value}
    </label>
  {/each}
</div>
