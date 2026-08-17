<script lang="ts">
  // The card presentation documented in the form-workflow guide. The card is
  // the radio's own label, so nothing is nested inside another label and the
  // group keeps native radio semantics.
  import Radio from "./Radio.svelte";

  export let value = "existing";
  export let onChange: ((value: string) => void) | undefined = undefined;

  const options = [
    { value: "existing", label: "Use an existing folder", description: "Already on this machine." },
    { value: "new", label: "Create a new folder", description: "An empty folder for the project." },
  ];
</script>

<fieldset>
  <legend>Where should the project live?</legend>
  {#each options as option (option.value)}
    <div class="card" data-selected={value === option.value ? "" : undefined}>
      <Radio
        name="project-location"
        value={option.value}
        checked={value === option.value}
        {onChange}
      >
        <span class="card__label">{option.label}</span>
        <span class="card__description">{option.description}</span>
      </Radio>
    </div>
  {/each}
</fieldset>
