<script lang="ts">
  import SearchField from "@design-system/svelte/SearchField.svelte";

  let value = "archive";
  let submitted = "";
</script>

<form
  class="search-demo"
  role="search"
  on:submit|preventDefault={() => {
    submitted = value;
  }}
>
  <SearchField
    label="Search tables and columns"
    hideLabel
    name="query"
    bind:value
    placeholder="Search tables and columns"
  />
  <p class="search-demo__status" aria-live="polite">
    {submitted ? `Submitted: ${submitted}` : "Enter a query and submit it."}
  </p>
</form>

<style>
  .search-demo {
    display: grid;
    gap: 0.75rem;
    inline-size: min(100%, 32rem);
  }
  .search-demo :global(.search-field) {
    inline-size: 100%;
  }
  .search-demo__status {
    margin: 0;
    color: var(--ds-color-text-secondary);
  }
</style>
