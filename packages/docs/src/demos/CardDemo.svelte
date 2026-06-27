<script>
  import Card from "@design-system/svelte/Card.svelte";
  import Tag from "@design-system/svelte/Tag.svelte";
  import Button from "@design-system/svelte/Button.svelte";
</script>

<div style="display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));">
  <!-- Dashboard metric tile -->
  <Card variant="dashboard" title="Monthly revenue" value="€48,200" change="+12.5%" trend="up" />

  <!-- Rich media card: image on top, title, tags (under the title, before the
       description), then a ghost link + primary action (no footer divider). -->
  <Card
    title="Spring collection"
    description="Fresh arrivals for the new season, hand-picked by our team."
  >
    <!-- Solid/gradient placeholder when there's no image, so it reads clearly. -->
    <div
      slot="media"
      aria-hidden="true"
      style="aspect-ratio: 16 / 9; background: linear-gradient(135deg, var(--ds-pastel-green, #8dcc7a), var(--ds-pastel-teal, #7abecc));"
    ></div>

    <svelte:fragment slot="tags">
      <Tag status="success">New</Tag>
      <Tag status="info">Limited</Tag>
    </svelte:fragment>

    <svelte:fragment slot="actions">
      <Button variant="ghost" onpress={() => {}} --ds-button-padding="0">
        <span style="text-decoration: underline; text-underline-offset: 2px;">Details</span>
      </Button>
      <Button variant="primary">Shop now</Button>
    </svelte:fragment>
  </Card>
</div>
