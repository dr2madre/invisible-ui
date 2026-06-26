<script>
  import Card from "@design-system/svelte/Card.svelte";
  import Tag from "@design-system/svelte/Tag.svelte";
</script>

<div style="display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));">
  <Card variant="dashboard" title="Monthly revenue" value="€48,200" change="+12.5%" trend="up" />

  <Card title="Spring collection" description="Fresh arrivals for the new season, hand-picked.">
    <svelte:fragment slot="tags">
      <Tag status="success">New</Tag>
    </svelte:fragment>
  </Card>
</div>
