<script lang="ts">
  import Card from "./Card.svelte";
  import Tag from "../tag/Tag.svelte";

  interface Props {
    variant?: "media" | "dashboard";
    orientation?: "vertical" | "horizontal";
    surface?: "default" | "secondary";
    /** Use an icon in the media area instead of an image. */
    withIcon?: boolean;
    imageSrc?: string;
  }

  let {
    variant = "media",
    orientation = "vertical",
    surface = "default",
    withIcon = false,
    imageSrc = "https://example.com/photo.jpg",
  }: Props = $props();
</script>

{#if variant === "dashboard"}
  <Card {surface} variant="dashboard" title="Revenue" value="€48.2k" change="+12%" trend="up">
    {#snippet icon()}<svg viewBox="0 0 16 16"><rect width="16" height="16" /></svg>{/snippet}
  </Card>
{:else if withIcon}
  <Card
    {orientation}
    {surface}
    title="Mountain retreat"
    description="A quiet cabin with a view of the valley."
  >
    {#snippet icon()}<svg viewBox="0 0 16 16"><rect width="16" height="16" /></svg>{/snippet}
    {#snippet tags()}
      <Tag status="success">Available</Tag>
      <Tag status="info">New</Tag>
    {/snippet}
    {#snippet actions()}
      <button type="button">Details</button>
      <button type="button">Book</button>
    {/snippet}
  </Card>
{:else}
  <Card
    {orientation}
    {surface}
    {imageSrc}
    imageAlt="A nice view"
    title="Mountain retreat"
    description="A quiet cabin with a view of the valley."
  >
    {#snippet tags()}
      <Tag status="success">Available</Tag>
      <Tag status="info">New</Tag>
    {/snippet}
    {#snippet actions()}
      <button type="button">Details</button>
      <button type="button">Book</button>
    {/snippet}
  </Card>
{/if}
