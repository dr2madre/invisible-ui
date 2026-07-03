<script lang="ts">
  import Combobox from "./Combobox.svelte";
  import type { ComboboxItem } from "./create-combobox";

  export let value: string | null = null;
  export let disabled = false;
  export let onValueChange: ((value: string | null) => void) | undefined = undefined;

  export let items: ComboboxItem[] = [
    { value: "apple", label: "Apple" },
    { value: "banana", label: "Banana" },
    { value: "blueberry", label: "Blueberry" },
    { value: "cherry", label: "Cherry", disabled: true },
    { value: "grape", label: "Grape" },
  ];
</script>

<Combobox label="Fruit" {items} {value} {disabled} {onValueChange} />
