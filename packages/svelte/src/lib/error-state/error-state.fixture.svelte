<script lang="ts">
  import ErrorState from "./ErrorState.svelte";
  import type { ComponentProps } from "svelte";

  interface Props {
    onAction?: () => void;
    actions?: ComponentProps<typeof ErrorState>["actions"];
    size?: ComponentProps<typeof ErrorState>["size"];
  }

  let { onAction, actions = [], size = "md" }: Props = $props();
</script>

{#if Array.isArray(actions) && actions.length}
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
