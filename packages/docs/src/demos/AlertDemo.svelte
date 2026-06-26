<script>
  import Alert from "@design-system/svelte/Alert.svelte";
</script>

<div style="display:grid; gap:0.75rem; inline-size:100%;">
  <Alert status="success" title="Saved" description="Your changes have been saved." />
  <Alert status="danger" title="Payment failed" description="Try a different card." closable />
</div>
