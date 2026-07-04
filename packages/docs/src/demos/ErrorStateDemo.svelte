<script>
  import ErrorState from "@design-system/svelte/ErrorState.svelte";
</script>

<div style="display: flex; flex-direction: column; gap: 2rem; inline-size: 100%;">
  <!-- A failed request / lost connection (500 or worse). -->
  <ErrorState
    title="Couldn't connect to the server"
    description="An unknown error occurred."
    actionLabel="Refresh"
    onAction={() => location.reload()}
  />

  <!-- The same layout as a 404 — only the icon and copy change. Here a custom
       glyph is passed through the `icon` slot. -->
  <ErrorState
    status="neutral"
    title="Page not found"
    description="The page you're looking for doesn't exist or was moved."
    actionLabel="Go to homepage"
  >
    <svg
      slot="icon"
      viewBox="0 0 24 24"
      width="3.5rem"
      height="3.5rem"
      fill="none"
      stroke="var(--ds-color-text-secondary)"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  </ErrorState>
</div>
