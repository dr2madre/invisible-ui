<script>
  import Card from "@design-system/svelte/Card.svelte";
  import Tag from "@design-system/svelte/Tag.svelte";
  import ButtonGroup from "@design-system/svelte/ButtonGroup.svelte";
  import Button from "@design-system/svelte/Button.svelte";
</script>

<div style="display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));">
  <!-- Dashboard metric tile -->
  <Card variant="dashboard" title="Monthly revenue" value="€48,200" change="+12.5%" trend="up" />

  <!-- Rich media card: image on top, date + tag, title, description, actions -->
  <Card
    title="Spring collection"
    description="Fresh arrivals for the new season, hand-picked by our team."
  >
    <div
      slot="media"
      aria-hidden="true"
      style="aspect-ratio: 16 / 9; background: linear-gradient(135deg, var(--ds-pastel-green, #8dcc7a), var(--ds-pastel-teal, #7abecc));"
    ></div>

    <svelte:fragment slot="tags">
      <span style="font-size: 0.8125rem; color: var(--ds-color-text-secondary);">12 May 2026</span>
      <Tag status="success">New</Tag>
    </svelte:fragment>

    <svelte:fragment slot="actions">
      <ButtonGroup label="Card actions" attached={false}>
        <Button variant="primary">Shop now</Button>
        <Button variant="ghost">Details</Button>
      </ButtonGroup>
    </svelte:fragment>
  </Card>
</div>
