<script>
  /** A small demo brand logo (mark + wordmark) for the sidebar. */
</script>

<span class="logo">
  <svg class="logo__mark" viewBox="0 0 24 24" aria-hidden="true">
    <rect x="2" y="2" width="20" height="20" rx="6" fill="var(--ds-color-primary, #2563eb)" />
    <path d="M8 12h8M12 8v8" stroke="#fff" stroke-width="2" stroke-linecap="round" />
  </svg>
  <span class="logo__word">Acme</span>
</span>

<style>
  .logo {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 700;
    color: var(--ds-color-text, #0f172a);
  }
  .logo__mark {
    inline-size: 1.5rem;
    block-size: 1.5rem;
  }
</style>
