<script>
  // A card presentation over native radios. The radio's own label is the card,
  // so nothing is nested inside another label, the whole card selects the
  // option, and the group keeps native keyboard behaviour.
  import Radio from "@design-system/svelte/Radio.svelte";

  const options = [
    {
      value: "existing",
      label: "Use an existing folder",
      description: "Point the project at a folder already on this machine.",
    },
    {
      value: "new",
      label: "Create a new folder",
      description: "Make an empty folder and set the project up inside it.",
    },
  ];

  let mode = "existing";
</script>

<fieldset class="choice">
  <legend class="choice__legend">Where should the project live?</legend>
  <div class="choice__cards">
    {#each options as option (option.value)}
      <div class="choice__card" data-selected={mode === option.value ? "" : undefined}>
        <Radio
          name="project-location"
          value={option.value}
          checked={mode === option.value}
          onChange={(next) => (mode = next)}
        >
          <span class="choice__text">
            <span class="choice__label">{option.label}</span>
            <span class="choice__description">{option.description}</span>
          </span>
        </Radio>
      </div>
    {/each}
  </div>
</fieldset>

<style>
  .choice {
    display: grid;
    gap: 0.75rem;
    margin: 0;
    padding: 0;
    border: 0;
  }
  .choice__legend {
    padding: 0;
    font-weight: 600;
  }
  .choice__cards {
    display: grid;
    gap: 0.5rem;
  }
  .choice__card {
    border: 1px solid var(--ds-color-border);
    border-radius: var(--ds-radius-surface, 0.75rem);
  }
  .choice__card:hover {
    background: var(--ds-state-hover);
  }
  /* Selection is a border weight and an inset outline as well as the radio's
     own checked state, so it never rests on colour alone. */
  .choice__card[data-selected] {
    border-color: var(--ds-color-primary);
    box-shadow: inset 0 0 0 1px var(--ds-color-primary);
  }
  .choice__card:focus-within {
    outline: none;
    box-shadow: var(--ds-focus-ring-shadow);
  }
  /* The label the Radio renders is the card surface: the whole box selects. */
  .choice__card :global(.radio) {
    align-items: start;
    inline-size: 100%;
    padding: 0.75rem;
  }
  .choice__text {
    display: grid;
    gap: 0.125rem;
  }
  .choice__label {
    font-weight: 600;
  }
  .choice__description {
    font-size: 0.875rem;
    color: var(--ds-color-text-secondary);
  }
</style>
