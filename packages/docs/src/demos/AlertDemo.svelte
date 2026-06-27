<script>
  import Alert from "@design-system/svelte/Alert.svelte";
</script>

<div style="display:grid; gap:0.75rem; inline-size:100%;">
  <!-- Tinted surface: the FeedbackIcon box goes transparent so it doesn't clash. -->
  <Alert status="success" title="Saved" description="Your changes have been saved." />
  <Alert status="danger" title="Payment failed" description="Try a different card." closable />

  <!-- No-surface (plain) variant: no tint/border; the colored chip carries the status. -->
  <Alert
    plain
    status="info"
    title="Heads up"
    description="This sits on the page with no surface — just the colored icon chip."
  />
</div>
