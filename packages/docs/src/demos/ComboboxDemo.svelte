<script>
  import Combobox from "@design-system/svelte/Combobox.svelte";

  const items = [
    { value: "apple", label: "Apple" },
    { value: "banana", label: "Banana" },
    { value: "blueberry", label: "Blueberry" },
    { value: "cherry", label: "Cherry" },
    { value: "grape", label: "Grape" },
  ];
</script>

<Combobox label="Fruit" {items} />
