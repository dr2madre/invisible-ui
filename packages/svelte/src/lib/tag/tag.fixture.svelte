<script lang="ts">
  import Tag from "./Tag.svelte";
  import Count from "../count/Count.svelte";

  export let status: "neutral" | "info" | "success" | "warning" | "danger" = "neutral";
  export let variant: "soft" | "solid" = "soft";
  export let removable = false;
  export let removeLabel: string | undefined = undefined;
  export let onRemove: (() => void) | undefined = undefined;
  export let withCount = false;
</script>

<Tag {status} {variant} {removable} removeLabel={removeLabel ?? "Remove"} {onRemove}>
  <svg slot="icon" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6" /></svg>
  In review
  {#if withCount}
    <Count slot="trailing" count={3} status="neutral" label="3 items" />
  {/if}
</Tag>
