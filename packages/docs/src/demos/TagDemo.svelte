<script>
  import Tag from "@design-system/svelte/Tag.svelte";
  import Button from "@design-system/svelte/Button.svelte";
  import Icon from "@design-system/svelte/Icon.svelte";

  // Removable tags actually leave the list on ✕; reset brings them back.
  const initial = ["Design", "Frontend", "Accessibility", "Docs"];
  let filters = [...initial];
</script>

<div style="display: grid; gap: 1.25rem;">
  <!-- Statuses -->
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
  </div>

  <!-- Removable: the ✕ removes the tag from the list. -->
  <div
    style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center; min-block-size: 2rem;"
  >
    {#each filters as filter (filter)}
      <Tag
        status="selected"
        removable
        removeLabel={`Remove ${filter}`}
        onRemove={() => (filters = filters.filter((f) => f !== filter))}
      >
        {filter}
      </Tag>
    {/each}
    {#if filters.length < initial.length}
      <!-- Reset sits a touch smaller than a default button (font + padding). -->
      <span
        style="font-size: 0.8125rem; --ds-control-padding-y: 0.35rem; --ds-control-padding-x: 0.6rem;"
      >
        <Button variant="ghost" onpress={() => (filters = [...initial])}>Reset</Button>
      </span>
    {/if}
  </div>
</div>
