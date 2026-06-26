<script>
  import AspectRatio from "@design-system/svelte/AspectRatio.svelte";
</script>

<div style="max-width: 24rem;">
  <AspectRatio ratio={16 / 9}>
    <div
      style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 600; background: linear-gradient(135deg, #2563eb, #7c3aed);"
    >
      16 : 9
    </div>
  </AspectRatio>
</div>
