<script>
  import Tag from "@design-system/svelte/Tag.svelte";
  import Icon from "@design-system/svelte/Icon.svelte";
</script>

<div style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;">
  <Tag status="neutral">Draft</Tag>
  <Tag status="info">In review</Tag>
  <Tag status="success">Published</Tag>
  <Tag status="warning">Needs work</Tag>
  <!-- Leading icon (a raised "halt" hand for a blocked status) -->
  <Tag status="danger">
    <Icon slot="icon">
      <path
        d="M18 11V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2 2 2 0 0 0-2-2 2 2 0 0 0-2 2v0a2 2 0 0 0-2-2 2 2 0 0 0-2 2v8"
      />
      <path d="M14 10V4a2 2 0 0 0-2-2 2 2 0 0 0-2 2v2" />
      <path d="M10 10.5V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v8a8 8 0 0 0 16 0v-3" />
    </Icon>
    Blocked
  </Tag>
  <Tag status="selected" removable onRemove={() => {}}>Removable</Tag>
</div>
