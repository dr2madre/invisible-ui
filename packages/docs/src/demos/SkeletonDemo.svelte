<script>
  import Skeleton from "@design-system/svelte/Skeleton.svelte";
</script>

<div style="display: flex; gap: 1rem; align-items: center; max-width: 22rem;">
  <Skeleton variant="circle" width="3rem" />
  <div style="flex: 1; display: flex; flex-direction: column; gap: 0.5rem;">
    <Skeleton variant="text" width="60%" />
    <Skeleton variant="text" lines={2} />
  </div>
</div>
