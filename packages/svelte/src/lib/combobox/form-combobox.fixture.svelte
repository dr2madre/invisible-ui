<script lang="ts">
  import Combobox from "./Combobox.svelte";

  export let value: string | null = null;
  export let name = "fruit";
  export let disabled = false;
</script>

<form data-testid="form">
  <Combobox
    label="Fruit"
    {name}
    {value}
    {disabled}
    items={[
      { value: "apple", label: "Apple" },
      { value: "pear", label: "Pear" },
    ]}
  />
</form>
