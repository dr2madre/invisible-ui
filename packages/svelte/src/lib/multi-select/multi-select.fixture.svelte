<script lang="ts">
  import MultiSelect from "./MultiSelect.svelte";
  import type { MultiSelectItem } from "./create-multi-select";

  export let items: MultiSelectItem[] = [
    { value: "ada", label: "Ada" },
    { value: "grace", label: "Grace" },
    { value: "alan", label: "Alan", disabled: true },
    { value: "edsger", label: "Edsger" },
  ];
  export let values: string[] = [];
  export let onValuesChange: ((values: string[]) => void) | undefined = undefined;
  // Feeds the callback value back into the prop, like a controlled consumer.
  export let bindValues = false;
  export let disabled = false;
  export let readOnly = false;
  export let max: number | undefined = undefined;
  export let removeOnBackspace = false;
  export let name: string | undefined = undefined;
  export let required = false;

  const handleChange = (next: string[]) => {
    if (bindValues) values = next;
    onValuesChange?.(next);
  };
</script>

<form data-testid="fixture-form" on:submit|preventDefault>
  <MultiSelect
    label="People"
    {items}
    {values}
    {disabled}
    {readOnly}
    {max}
    {removeOnBackspace}
    {name}
    {required}
    onValuesChange={bindValues ? handleChange : onValuesChange}
  />
  <button type="submit">Submit</button>
</form>
