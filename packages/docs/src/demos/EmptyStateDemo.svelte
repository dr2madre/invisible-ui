<script>
  import EmptyState from "@design-system/svelte/EmptyState.svelte";
  import Button from "@design-system/svelte/Button.svelte";
</script>

<div style="display: flex; flex-direction: column; gap: 2rem; inline-size: 100%;">
  <!-- First run: the theme's neutral icon, one inviting action. -->
  <EmptyState
    title="No projects yet"
    description="Create your first project to get started."
    actionLabel="Add a project"
  />

  <!-- No search results: a custom illustration through the `illustration`
       slot, and two actions through the `actions` slot. -->
  <EmptyState
    title="No results for “tofu”"
    description="Check the spelling or try a broader search."
  >
    <svg
      slot="illustration"
      viewBox="0 0 24 24"
      width="72"
      height="72"
      fill="none"
      stroke="var(--ds-color-text-secondary)"
      stroke-width="1.25"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <path d="M8 13c.9-1.2 2-1.8 3-1.8s2.1.6 3 1.8" transform="rotate(180 11 12)" />
    </svg>
    <svelte:fragment slot="actions">
      <Button variant="default">Clear search</Button>
      <Button variant="ghost">Browse all recipes</Button>
    </svelte:fragment>
  </EmptyState>
</div>
