<script lang="ts">
  import Checkbox from "./checkbox/Checkbox.svelte";
  import Combobox from "./combobox/Combobox.svelte";
  import DatePicker from "./date-picker/DatePicker.svelte";
  import MultiSelect from "./multi-select/MultiSelect.svelte";
  import NumberField from "./number-field/NumberField.svelte";
  import Select from "./select/Select.svelte";
  import TextField from "./text-field/TextField.svelte";
  import TimeField from "./time-field/TimeField.svelte";

  /** Application errors injected mid-edit onto three control families. */
  export let nameError: string | undefined = undefined;
  export let amountError: string | undefined = undefined;
  export let timeError: string | undefined = undefined;
  export let onNameChange: ((value: string) => void) | undefined = undefined;
  export let onAmountChange: ((value: number | null) => void) | undefined = undefined;
  export let onAmountCommit: ((value: number | null) => void) | undefined = undefined;
  /** Render the same composed form twice to prove ids and payloads stay apart. */
  export let second = false;

  const countries = [
    { value: "it", label: "Italy" },
    { value: "fr", label: "France" },
  ];
  const fruits = [
    { value: "apple", label: "Apple" },
    { value: "pear", label: "Pear" },
  ];
  const skills = [
    { value: "svelte", label: "Svelte" },
    { value: "vue", label: "Vue" },
    { value: "react", label: "React" },
  ];
</script>

<form data-testid="composed-form">
  <TextField label="Name" name="name" value="Ada" error={nameError} onValueChange={onNameChange} />
  <Checkbox label="Subscribe" name="subscribe" value="yes" checked />
  <Select label="Country" name="country" value="it" items={countries} />
  <Combobox label="Fruit" name="fruit" value="pear" items={fruits} />
  <MultiSelect label="Skills" name="skills" values={["svelte", "vue"]} items={skills} />
  <NumberField
    label="Amount"
    name="amount"
    value={1234.5}
    locale="it-IT"
    step={0.5}
    error={amountError}
    onValueChange={onAmountChange}
    onValueCommit={onAmountCommit}
  />
  <TimeField label="Time" name="time" value="09:30" error={timeError} />
  <DatePicker label="Due date" name="due" value="2026-06-15" />
  <button type="reset">Reset</button>
</form>

{#if second}
  <form data-testid="second-form">
    <TextField label="Name" name="name" value="Grace" />
    <NumberField label="Amount" name="amount" value={2} locale="it-IT" step={0.5} />
    <MultiSelect label="Skills" name="skills" values={["react"]} items={skills} />
  </form>
{/if}
