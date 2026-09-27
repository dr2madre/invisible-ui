<script lang="ts">
  import Tag from "./Tag.svelte";
  import Count from "../count/Count.svelte";

  interface Props {
    status?: "neutral" | "info" | "success" | "warning" | "danger";
    variant?: "soft" | "solid";
    removable?: boolean;
    removeLabel?: string;
    onRemove?: () => void;
    withCount?: boolean;
  }

  let {
    status = "neutral",
    variant = "soft",
    removable = false,
    removeLabel,
    onRemove,
    withCount = false,
  }: Props = $props();
</script>

{#snippet count()}
  <Count count={3} status="neutral" label="3 items" />
{/snippet}

<Tag
  {status}
  {variant}
  {removable}
  {removeLabel}
  {onRemove}
  trailing={withCount ? count : undefined}
>
  {#snippet icon()}
    <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6" /></svg>
  {/snippet}
  In review
</Tag>
