<script lang="ts">
  import Checkbox from "./checkbox/Checkbox.svelte";
  import Combobox from "./combobox/Combobox.svelte";
  import DatePicker from "./date-picker/DatePicker.svelte";
  import MultiSelect from "./multi-select/MultiSelect.svelte";
  import NumberField from "./number-field/NumberField.svelte";
  import Select from "./select/Select.svelte";
  import TextField from "./text-field/TextField.svelte";
  import TimeField from "./time-field/TimeField.svelte";

  interface Props {
    /** Application errors injected mid-edit onto three control families. */
    nameError?: string;
    amountError?: string;
    timeError?: string;
    onNameChange?: (value: string) => void;
    onAmountChange?: (value: number | null) => void;
    onAmountCommit?: (value: number | null) => void;
    /** Render the same composed form twice to prove ids and payloads stay apart. */
    second?: boolean;
    allDisabled?: boolean;
  }

  let {
    nameError,
    amountError,
    timeError,
    onNameChange,
    onAmountChange,
    onAmountCommit,
    second = false,
    allDisabled = false,
  }: Props = $props();

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
  <TextField
    label="Name"
    name="name"
    value="Ada"
    error={nameError}
    onValueChange={onNameChange}
    disabled={allDisabled}
  />
  <Checkbox label="Subscribe" name="subscribe" value="yes" checked disabled={allDisabled} />
  <Select label="Country" name="country" value="it" items={countries} disabled={allDisabled} />
  <Combobox label="Fruit" name="fruit" value="pear" items={fruits} disabled={allDisabled} />
  <MultiSelect
    label="Skills"
    name="skills"
    values={["svelte", "vue"]}
    items={skills}
    disabled={allDisabled}
  />
  <NumberField
    disabled={allDisabled}
    label="Amount"
    name="amount"
    value={1234.5}
    locale="it-IT"
    step={0.5}
    error={amountError}
    onValueChange={onAmountChange}
    onValueCommit={onAmountCommit}
  />
  <TimeField label="Time" name="time" value="09:30" error={timeError} disabled={allDisabled} />
  <DatePicker label="Due date" name="due" value="2026-06-15" disabled={allDisabled} />
  <button type="reset">Reset</button>
</form>

{#if second}
  <form data-testid="second-form">
    <TextField label="Name" name="name" value="Grace" />
    <NumberField label="Amount" name="amount" value={2} locale="it-IT" step={0.5} />
    <MultiSelect label="Skills" name="skills" values={["react"]} items={skills} />
  </form>
{/if}
