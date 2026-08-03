<script lang="ts">
  import ErrorState from "./ErrorState.svelte";
  import type { ComponentProps } from "svelte";

  export let onAction: (() => void) | undefined = undefined;
  export let actions: ComponentProps<ErrorState>["actions"] = [];
  export let size: ComponentProps<ErrorState>["size"] = "md";
</script>

{#if actions?.length}
  <ErrorState
    {size}
    title="Couldn't connect to the server"
    description="An unknown error occurred."
    {actions}
  />
{:else}
  <ErrorState
    {size}
    title="Couldn't connect to the server"
    description="An unknown error occurred."
    actionLabel="Try again"
    {onAction}
  />
{/if}
