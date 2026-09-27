<script lang="ts">
  import Combobox from "./Combobox.svelte";
  import type { ComboboxItem } from "./create-combobox";

  interface Props {
    value?: string | null;
    disabled?: boolean;
    onValueChange?: (value: string | null) => void;
    items?: ComboboxItem[];
  }

  let {
    value = null,
    disabled = false,
    onValueChange,
    items = [
      { value: "apple", label: "Apple" },
      { value: "banana", label: "Banana" },
      { value: "blueberry", label: "Blueberry" },
      { value: "cherry", label: "Cherry", disabled: true },
      { value: "grape", label: "Grape" },
    ],
  }: Props = $props();
</script>

<Combobox label="Fruit" {items} {value} {disabled} {onValueChange} />
