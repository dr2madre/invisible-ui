<script>
  import Notice from "@design-system/svelte/Notice.svelte";
</script>

<div style="display:grid; gap:0.75rem; inline-size:100%; max-inline-size:24rem;">
  <Notice status="success" title="Saved" text="Your changes have been saved." />
  <Notice status="danger" title="Payment failed" text="Try a different card." />
  <Notice
    status="info"
    title="Update available"
    text="A new version is ready to install."
    closable={false}
  />
  <!-- With an undo action (duration 0: stays until dismissed). -->
  <Notice
    status="info"
    title="File deleted"
    text="report-january.pdf was moved to trash."
    duration={0}
    actions={[{ label: "Undo", variant: "primary", keepOpen: true }]}
  />
</div>
