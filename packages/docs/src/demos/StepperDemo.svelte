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

<Stepper {steps} {current} label="Checkout" onStepChange={(i) => (current = i)} />
