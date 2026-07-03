<script>
  import Alert from "@design-system/svelte/Alert.svelte";
</script>

<div style="display:grid; gap:0.75rem; inline-size:100%;">
  <!-- Tinted surface: the FeedbackIcon box goes transparent so it doesn't clash. -->
  <Alert status="success" title="Saved" description="Your changes have been saved." />
  <Alert status="danger" title="Payment failed" description="Try a different card." closable />

  <!-- Tinted surface with a forced round, tinted icon chip. -->
  <Alert
    iconShape="round"
    iconBox="tint"
    status="warning"
    title="Storage almost full"
    description="You are using 90% of your space — the round chip variant."
  />

  <!-- With a link. -->
  <Alert
    status="info"
    title="Update available"
    description="A new version of the app is ready to install."
    href="#"
    linkText="See what's new"
  />

  <!-- No-surface (plain) variant: no tint/border; the colored chip carries the status. -->
  <Alert
    plain
    status="info"
    title="Heads up"
    description="This sits on the page with no surface — just the colored icon chip."
  />
</div>
