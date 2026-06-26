<script lang="ts">
  import { createRadioGroup, type RadioItem } from "./create-radio-group";

  export let value: string | null = null;
  export let disabled = false;
  export let items: RadioItem[] = [{ value: "small" }, { value: "medium" }, { value: "large" }];

  const { state: radioState, setValue, name } = createRadioGroup({ value, items, disabled });
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
        on:change={() => setValue(item.value)}
      />
      {item.value}
    </label>
  {/each}
</div>
