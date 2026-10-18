<script>
  import Combobox from "@invisible-ui/svelte/Combobox.svelte";
  import ConfirmDialog from "@invisible-ui/svelte/ConfirmDialog.svelte";
  import Dialog from "@invisible-ui/svelte/Dialog.svelte";
  import MultiSelect from "@invisible-ui/svelte/MultiSelect.svelte";
  import TextField from "@invisible-ui/svelte/TextField.svelte";
  import Tooltip from "@invisible-ui/svelte/Tooltip.svelte";

  const cities = [
    { value: "london", label: "London" },
    { value: "milan", label: "Milan" },
    { value: "tokyo", label: "Tokyo" },
  ];
  const skills = [
    { value: "svelte", label: "Svelte" },
    { value: "vue", label: "Vue" },
    { value: "react", label: "React" },
  ];

  let name = $state("");
  // Three, so removing one still leaves a neighbour to hand focus to.
  let skillValues = $state(["svelte", "vue", "react"]);
  let outcome = $state("none");
</script>

<div class="dialog-composition-demo">
  <Tooltip text="Update your profile details">
    <Dialog title="Edit profile" bodyLayout="stack">
      {#snippet trigger()}<span>Edit profile</span>{/snippet}
      <TextField label="Name" value={name} onValueChange={(next) => (name = next)} />
      <Combobox label="City" items={cities} />
      <MultiSelect
        label="Skills"
        items={skills}
        values={skillValues}
        onValuesChange={(next) => (skillValues = next)}
      />
      {#snippet footer()}
        <ConfirmDialog
          title="Discard changes?"
          description="Your edits will be lost."
          confirmVariant="danger"
          onConfirm={() => (outcome = "discarded")}
        >
          Discard
        </ConfirmDialog>
      {/snippet}
    </Dialog>
  </Tooltip>
  <p data-testid="composition-outcome">Outcome: {outcome}</p>
</div>

<style>
  .dialog-composition-demo {
    display: grid;
    gap: 1rem;
    justify-items: start;
  }
  .dialog-composition-demo p {
    margin: 0;
    color: var(--ds-color-text-secondary, #515151);
  }
</style>
