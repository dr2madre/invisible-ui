<script lang="ts">
  import SearchField from "@design-system/svelte/SearchField.svelte";

  const TABLES = ["accounts", "archive", "audit_log", "invoices", "orders", "users"];

  let query = "";
  $: matches = TABLES.filter((name) => name.includes(query.trim().toLowerCase()));
</script>

<div class="filter-demo">
  <SearchField
    label="Filter tables"
    hideLabel
    placeholder="Filter tables"
    submitButton={false}
    bind:value={query}
  />
  <p class="filter-demo__status" aria-live="polite">
    {matches.length === 1 ? "1 table" : `${matches.length} tables`}
  </p>
  <ul class="filter-demo__list">
    {#each matches as name (name)}
      <li>{name}</li>
    {/each}
  </ul>
</div>

<style>
  .filter-demo {
    display: grid;
    gap: 0.75rem;
    inline-size: min(100%, 32rem);
  }
  .filter-demo :global(.search-field) {
    inline-size: 100%;
  }
  .filter-demo__status {
    margin: 0;
    color: var(--ds-color-text-secondary);
  }
  .filter-demo__list {
    margin: 0;
    padding-inline-start: 1.25rem;
  }
</style>
