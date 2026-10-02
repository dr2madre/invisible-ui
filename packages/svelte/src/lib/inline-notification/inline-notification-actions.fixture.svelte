<script lang="ts">
  import InlineNotification from "./InlineNotification.svelte";
  import Button from "../button/Button.svelte";

  interface Props {
    onRetry?: () => void;
    onCancel?: () => void;
  }

  let { onRetry, onCancel }: Props = $props();
</script>

<InlineNotification
  status="danger"
  title="Payment failed"
  description="We couldn't process your card."
>
  {#snippet actions()}
    <Button variant="primary" onpress={() => onRetry?.()}>Retry</Button>
    <Button variant="ghost" onpress={() => onCancel?.()}>Cancel</Button>
  {/snippet}
</InlineNotification>
