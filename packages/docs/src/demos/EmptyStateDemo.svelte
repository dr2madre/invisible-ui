<script>
  import EmptyState from "@design-system/svelte/EmptyState.svelte";
</script>

<div style="display: flex; flex-direction: column; gap: 2rem; inline-size: 100%;">
  <!-- First run: the theme's neutral icon, one inviting action. -->
  <EmptyState
    title="No projects yet"
    description="Create your first project to get started."
    actionLabel="Add a project"
  />

  <!-- No search results: a custom illustration through the `illustration`
       slot, and a configurable action group through the `actions` prop. -->
  <EmptyState
    title="No results for “tofu”"
    description="Check the spelling or try a broader search."
    actions={[{ label: "Clear search" }, { label: "Browse all recipes" }]}
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
  </EmptyState>

  <!-- Compact size for panels and cards, a learning cue in the default
       slot, and a documentation link in the action group. -->
  <div
    style="border: 1px solid var(--ds-color-border, #c7c1b7); border-radius: 0.75rem; inline-size: 100%;"
  >
    <EmptyState
      size="sm"
      title="No favorites yet"
      actions={[
        { label: "Browse components" },
        { label: "Learn more", href: "https://en.wikipedia.org/wiki/Bookmark_(digital)" },
      ]}
    >
      <p style="margin: 0; font-size: 0.875rem; color: var(--ds-color-text-secondary, #524c44);">
        Star any component and it appears here.
      </p>
    </EmptyState>
  </div>
</div>
