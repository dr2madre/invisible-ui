<script lang="ts">
  import Card from "./Card.svelte";
  import Tag from "../tag/Tag.svelte";

  export let variant: "media" | "dashboard" = "media";
  export let orientation: "vertical" | "horizontal" = "vertical";
  /** Use an icon in the media area instead of an image. */
  export let withIcon = false;
  export let imageSrc: string | undefined = "https://example.com/photo.jpg";
</script>

{#if variant === "dashboard"}
  <Card variant="dashboard" title="Revenue" value="€48.2k" change="+12%" trend="up">
    <svg slot="icon" viewBox="0 0 16 16"><rect width="16" height="16" /></svg>
  </Card>
{:else if withIcon}
  <Card
    {orientation}
    title="Mountain retreat"
    description="A quiet cabin with a view of the valley."
  >
    <svg slot="icon" viewBox="0 0 16 16"><rect width="16" height="16" /></svg>
    <svelte:fragment slot="tags">
      <Tag status="success">Available</Tag>
      <Tag status="info">New</Tag>
    </svelte:fragment>
    <svelte:fragment slot="actions">
      <button type="button">Details</button>
      <button type="button">Book</button>
    </svelte:fragment>
  </Card>
{:else}
  <Card
    {orientation}
    {imageSrc}
    imageAlt="A nice view"
    title="Mountain retreat"
    description="A quiet cabin with a view of the valley."
  >
    <svelte:fragment slot="tags">
      <Tag status="success">Available</Tag>
      <Tag status="info">New</Tag>
    </svelte:fragment>
    <svelte:fragment slot="actions">
      <button type="button">Details</button>
      <button type="button">Book</button>
    </svelte:fragment>
  </Card>
{/if}
