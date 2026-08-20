<script>
  import MultiSelect from "@design-system/svelte/MultiSelect.svelte";

  const items = [
    { value: "ada", label: "Ada Lovelace" },
    { value: "grace", label: "Grace Hopper" },
    { value: "barbara", label: "Barbara Liskov" },
    { value: "alan", label: "Alan Turing", disabled: true },
    { value: "edsger", label: "Edsger Dijkstra" },
    { value: "katherine", label: "Katherine Johnson" },
  ];

  let values = ["grace"];
  let submitted = "none";

  function onSubmit(event) {
    event.preventDefault();
    submitted = new FormData(event.currentTarget).getAll("people").join(", ") || "none";
  }
</script>

<form class="multi-select-demo" on:submit={onSubmit}>
  <MultiSelect
    label="People"
    {items}
    {values}
    name="people"
    removeOnBackspace
    onValuesChange={(next) => (values = next)}
  />
  <button type="submit" class="multi-select-demo__submit">Submit</button>
  <p data-testid="submitted-readout">Submitted: {submitted}</p>
</form>

<style>
  .multi-select-demo {
    display: grid;
    gap: 0.75rem;
    justify-items: start;
  }
  .multi-select-demo__submit {
    font: inherit;
    padding: 0.45rem 1rem;
    color: var(--ds-color-text, #0f172a);
    background: var(--ds-color-surface, #fff);
    border: 1px solid var(--ds-color-border, #cbd5e1);
    border-radius: var(--ds-radius-control, 0.375rem);
    cursor: pointer;
  }
  .multi-select-demo__submit:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring-shadow);
  }
</style>
