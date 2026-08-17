<script>
  import Stepper from "@design-system/svelte/Stepper.svelte";

  let current = 1;

  const steps = [
    { label: "Cart", description: "Review items" },
    { label: "Shipping", description: "Address" },
    { label: "Payment", description: "Card details" },
    { label: "Confirm", description: "Place order" },
  ];
</script>

<div class="stepper-demo">
  <Stepper {steps} {current} label="Checkout" onStepChange={(i) => (current = i)} />
</div>

<style>
  /* The preview is a flex row; the demo takes the full line so the stepper's
     container query responds to the preview's width. */
  .stepper-demo {
    flex: 1 1 100%;
    min-inline-size: 0;
  }
</style>
