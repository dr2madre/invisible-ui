<script lang="ts">
  import EmptyState from "./EmptyState.svelte";
  import type { ComponentProps } from "svelte";

  export let onAction: (() => void) | undefined = undefined;
  export let withIllustration = false;
  export let actions: ComponentProps<EmptyState>["actions"] = [];
  export let size: ComponentProps<EmptyState>["size"] = "md";
</script>

{#if actions.length}
  <EmptyState
    {size}
    title="No projects yet"
    description="Create your first project to get started."
    {actions}
  />
{:else if withIllustration}
  <EmptyState
    {size}
    title="No projects yet"
    description="Create your first project to get started."
    actionLabel="Add a project"
    {onAction}
  >
    <svg
      slot="illustration"
      data-testid="custom-illustration"
      viewBox="0 0 24 24"
      width="96"
      height="96"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
    >
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  </EmptyState>
{:else}
  <EmptyState
    {size}
    title="No projects yet"
    description="Create your first project to get started."
    actionLabel="Add a project"
    {onAction}
  />
{/if}
