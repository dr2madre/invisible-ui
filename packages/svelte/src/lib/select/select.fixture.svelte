<script lang="ts">
  import { untrack } from "svelte";
  import { createSelect, type SelectItem } from "./create-select";

  interface Props {
    value?: string | null;
    disabled?: boolean;
    onValueChange?: (value: string) => void;
    items?: SelectItem[];
  }

  let {
    value = null,
    disabled = false,
    onValueChange,
    items = [
      { value: "apple", label: "Apple" },
      { value: "banana", label: "Banana" },
      { value: "cherry", label: "Cherry", disabled: true },
      { value: "date", label: "Date" },
    ],
  }: Props = $props();

  const { labelAction, triggerAction, listboxAction, optionAction } = untrack(() =>
    createSelect({ items, value, disabled, onValueChange }),
  );
</script>

<span use:labelAction>Fruit</span>
<button type="button" use:triggerAction>Choose</button>
<ul use:listboxAction>
  {#each items as item (item.value)}
    <li use:optionAction={item.value}>{item.label ?? item.value}</li>
  {/each}
</ul>
