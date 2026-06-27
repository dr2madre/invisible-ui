<script>
  import AspectRatio from "@design-system/svelte/AspectRatio.svelte";
</script>

<div style="max-width: 24rem; width: 100%;">
  <AspectRatio ratio={16 / 9}>
    <div class="ar-demo">
      <svg
        viewBox="0 0 24 24"
        width="28"
        height="28"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        aria-hidden="true"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="9" cy="9" r="2" />
        <path d="m21 15-3.6-3.6a2 2 0 0 0-2.8 0L6 21" />
      </svg>
      <span>16 : 9</span>
    </div>
  </AspectRatio>
</div>

<style>
  .ar-demo {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    background: var(--ds-color-surface, #f5f5f4);
    border: 1px dashed var(--ds-color-border, #e7e5e4);
    border-radius: var(--ds-radius-surface, 0.75rem);
    color: var(--ds-color-text-secondary, #57534e);
    font-weight: 600;
    font-size: 0.875rem;
  }
</style>
