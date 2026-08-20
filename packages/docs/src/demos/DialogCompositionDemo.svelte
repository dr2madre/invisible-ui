<script>
  import Combobox from "@design-system/svelte/Combobox.svelte";
  import ConfirmDialog from "@design-system/svelte/ConfirmDialog.svelte";
  import Dialog from "@design-system/svelte/Dialog.svelte";
  import MultiSelect from "@design-system/svelte/MultiSelect.svelte";
  import TextField from "@design-system/svelte/TextField.svelte";
  import Tooltip from "@design-system/svelte/Tooltip.svelte";

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

  let name = "";
  let skillValues = ["svelte"];
  let outcome = "none";
</script>

<div class="dialog-composition-demo">
  <Tooltip text="Update your profile details">
    <Dialog title="Edit profile" bodyLayout="stack">
      <span slot="trigger">Edit profile</span>
      <TextField label="Name" value={name} onValueChange={(next) => (name = next)} />
      <Combobox label="City" items={cities} />
      <MultiSelect
        label="Skills"
        items={skills}
        values={skillValues}
        onValuesChange={(next) => (skillValues = next)}
      />
      <svelte:fragment slot="footer">
        <ConfirmDialog
          title="Discard changes?"
          description="Your edits will be lost."
          confirmVariant="danger"
          onConfirm={() => (outcome = "discarded")}
        >
          Discard
        </ConfirmDialog>
      </svelte:fragment>
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
    color: var(--ds-color-text-secondary, #64748b);
  }
</style>
