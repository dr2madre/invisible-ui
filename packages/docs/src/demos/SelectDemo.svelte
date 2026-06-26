<script>
  import Select from "@design-system/svelte/Select.svelte";
</script>

<Select
  label="Fruit"
  value="banana"
  placeholder="Select a fruit…"
  items={[
    { value: "apple", label: "Apple" },
    { value: "banana", label: "Banana" },
    { value: "cherry", label: "Cherry" },
  ]}
/>
