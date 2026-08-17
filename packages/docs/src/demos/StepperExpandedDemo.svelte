<script>
  // Deliberately expanded labels, including one unbroken token: the sequence
  // has to stay readable when words grow, with no truncation and no sideways
  // scrolling.
  import Stepper from "@design-system/svelte/Stepper.svelte";

  let current = 1;

  const steps = [
    { label: "Zahlungsinformationen bestätigen", description: "Kreditkarte oder Lastschrift" },
    {
      label: "Rindfleischetikettierungsüberwachungsaufgabenübertragungsgesetz",
      description: "Ein einziges Wort ohne Leerzeichen",
    },
    { label: "Bestellübersicht abschließen", description: "Alles noch einmal ansehen" },
  ];
</script>

<div class="stepper-expanded" data-testid="stepper-expanded">
  <Stepper
    {steps}
    {current}
    linear={false}
    label="Bestellvorgang"
    onStepChange={(i) => (current = i)}
  />
</div>

<style>
  /* The preview is a flex row; the demo takes the full line so the stepper's
     container query responds to the preview's width. */
  .stepper-expanded {
    flex: 1 1 100%;
    min-inline-size: 0;
  }
</style>
