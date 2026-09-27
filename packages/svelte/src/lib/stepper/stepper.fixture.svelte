<script lang="ts">
  import Stepper, { type StepDescriptor } from "./Stepper.svelte";

  interface Props {
    current?: number;
    linear?: boolean;
    orientation?: "horizontal" | "vertical";
  }

  let { current = 1, linear = true, orientation = "horizontal" }: Props = $props();

  const steps: StepDescriptor[] = [
    { label: "Account", description: "Your details" },
    { label: "Shipping", description: "Where to send it" },
    { label: "Payment", description: "How you'll pay" },
    { label: "Review", description: "Confirm and submit" },
  ];
</script>

<Stepper {steps} {current} {linear} {orientation} label="Checkout progress" />
