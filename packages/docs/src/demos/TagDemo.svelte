<script>
  import Tag from "@design-system/svelte/Tag.svelte";
</script>

<div style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;">
  <Tag status="neutral">Draft</Tag>
  <Tag status="info">In review</Tag>
  <Tag status="success" variant="solid">Published</Tag>
  <Tag status="warning">Needs work</Tag>
  <Tag status="danger">Blocked</Tag>
  <Tag status="info" removable onRemove={() => {}}>Removable</Tag>
</div>
