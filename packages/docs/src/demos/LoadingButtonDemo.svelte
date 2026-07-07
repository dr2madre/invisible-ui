<script>
  import Button from "@design-system/svelte/Button.svelte";

  let saving = false;
  const save = () => {
    saving = true;
    setTimeout(() => (saving = false), 2500);
  };
</script>

<div style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;">
  <!-- Press to see the transition: spinner in, presses ignored, label stable. -->
  <Button variant="primary" loading={saving} loadingStatus="Saving…" onpress={save}>
    Save changes
  </Button>
  <Button loading>Loading</Button>
  <Button variant="secondary" loading>Processing</Button>
</div>
