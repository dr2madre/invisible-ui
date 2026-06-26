<script lang="ts">
  import { createSelect, type SelectItem } from "./create-select";

  export let value: string | null = null;
  export let disabled = false;
  export let onValueChange: ((value: string) => void) | undefined = undefined;
  export let items: SelectItem[] = [
    { value: "apple", label: "Apple" },
    { value: "banana", label: "Banana" },
    { value: "cherry", label: "Cherry", disabled: true },
    { value: "date", label: "Date" },
  ];

  const { labelAction, triggerAction, listboxAction, optionAction } = createSelect({
    items,
    value,
    disabled,
    onValueChange,
  });
</script>

<span use:labelAction>Fruit</span>
<button type="button" use:triggerAction>Choose</button>
<ul use:listboxAction>
  {#each items as item (item.value)}
    <li use:optionAction={item.value}>{item.label ?? item.value}</li>
  {/each}
</ul>
