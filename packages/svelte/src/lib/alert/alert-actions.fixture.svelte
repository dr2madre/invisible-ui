<script lang="ts">
  import Alert from "./Alert.svelte";
  import Button from "../button/Button.svelte";

  export let onRetry: (() => void) | undefined = undefined;
  export let onCancel: (() => void) | undefined = undefined;
</script>

<Alert status="danger" title="Payment failed" description="We couldn't process your card.">
  <svelte:fragment slot="actions">
    <Button variant="primary" onpress={() => onRetry?.()}>Retry</Button>
    <Button variant="ghost" onpress={() => onCancel?.()}>Cancel</Button>
  </svelte:fragment>
</Alert>
