<script>
  import Skeleton from "@design-system/svelte/Skeleton.svelte";
</script>

<div style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 24rem;">
  <!-- Avatar + text lines (pulse) -->
  <div style="display: flex; gap: 1rem; align-items: center;">
    <Skeleton variant="circle" width="3rem" />
    <div style="flex: 1; display: flex; flex-direction: column; gap: 0.5rem;">
      <Skeleton variant="text" width="60%" />
      <Skeleton variant="text" lines={2} />
    </div>
  </div>

  <!-- Wave animation -->
  <Skeleton variant="text" lines={3} animation="wave" />

  <!-- Long, low, rounded-rectangle (e.g. a button or pill placeholder) -->
  <Skeleton variant="rect" width="100%" height="2.5rem" radius="999px" />
</div>
