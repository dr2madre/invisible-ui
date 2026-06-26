<script lang="ts">
  import Stepper, { type StepDescriptor } from "./Stepper.svelte";

  export let current = 1;
  export let linear = true;
  export let orientation: "horizontal" | "vertical" = "horizontal";

  const steps: StepDescriptor[] = [
    { label: "Account", description: "Your details" },
    { label: "Shipping", description: "Where to send it" },
    { label: "Payment", description: "How you'll pay" },
    { label: "Review", description: "Confirm and submit" },
  ];
</script>

<Stepper {steps} {current} {linear} {orientation} label="Checkout progress" />
