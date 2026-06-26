<script>
  import Progress from "@design-system/svelte/Progress.svelte";
</script>

<div style="max-width: 22rem; display: flex; flex-direction: column; gap: 1rem;">
  <Progress value={62} label="Uploading" />
  <Progress value={null} label="Working" />
</div>
