<script lang="ts">
  import Combobox from "./Combobox.svelte";

  interface Props {
    value?: string | null;
    name?: string;
    disabled?: boolean;
  }

  let { value = null, name = "fruit", disabled = false }: Props = $props();
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
