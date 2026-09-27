<script lang="ts">
  import MultiSelect from "./MultiSelect.svelte";
  import type { MultiSelectItem } from "./create-multi-select";

  interface Props {
    items?: MultiSelectItem[];
    values?: string[];
    onValuesChange?: (values: string[]) => void;
    /** Feeds the callback value back into the prop, like a controlled consumer. */
    bindValues?: boolean;
    disabled?: boolean;
    readOnly?: boolean;
    max?: number;
    removeOnBackspace?: boolean;
    name?: string;
    required?: boolean;
  }

  let {
    items = [
      { value: "ada", label: "Ada" },
      { value: "grace", label: "Grace" },
      { value: "alan", label: "Alan", disabled: true },
      { value: "edsger", label: "Edsger" },
    ],
    values = [],
    onValuesChange,
    bindValues = false,
    disabled = false,
    readOnly = false,
    max,
    removeOnBackspace = false,
    name,
    required = false,
  }: Props = $props();

  const handleChange = (next: string[]) => {
    if (bindValues) values = next;
    onValuesChange?.(next);
  };
</script>

<form data-testid="fixture-form" onsubmit={(event) => event.preventDefault()}>
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
