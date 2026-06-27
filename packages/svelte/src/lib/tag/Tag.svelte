<script lang="ts">
  /**
   * Tag — a small, colored chip that labels or categorises content (what some
   * systems call a "label" or "chip"). It carries a status color, text, optional
   * leading/trailing icons (via the `icon` / `trailing` slots), and may include a
   * small `Count` for a number. Optionally removable.
   *
   * Note: this is distinct from `Label` (the form-control label) and from `Count`
   * (the standalone notification number) — a Tag may *contain* a Count.
   *
   * Accessibility:
   * - The chip is presentational; its meaning is the visible text.
   * - When `removable`, a ghost remove button is rendered with an accessible name
   *   (`removeLabel`, defaulting to "Remove <text>") and a decorative ✕ glyph.
   * - The status is conveyed by color *and* text, never by color alone.
   *
   * Colors are themeable CSS custom properties (`--ds-tag-*`), falling back to the
   * shared status token layer (`--ds-color-*`).
   */
  type TagStatus = "neutral" | "info" | "success" | "warning" | "danger" | "selected";

  export let status: TagStatus = "neutral";
  /** Visual weight: a soft tinted surface (default) or a solid, filled chip. */
  export let variant: "soft" | "solid" = "soft";
  /** Size of the chip. */
  export let size: "sm" | "md" = "md";
  /** Render a remove (✕) button. Defaults to `false`. */
  export let removable = false;
  /** Accessible name for the remove button. Falls back to "Remove". */
  export let removeLabel = "Remove";
  /** Called when the remove button is pressed. */
  export let onRemove: (() => void) | undefined = undefined;
</script>

<span class="tag" data-status={status} data-variant={variant} data-size={size}>
  {#if $$slots.icon}
    <span class="tag__icon" aria-hidden="true"><slot name="icon" /></span>
  {/if}
  <span class="tag__label"><slot /></span>
  {#if $$slots.trailing}
    <span class="tag__trailing"><slot name="trailing" /></span>
  {/if}
  {#if removable}
    <button
      type="button"
      class="tag__remove"
      aria-label={removeLabel}
      on:click={() => onRemove?.()}
    >
      <svg viewBox="0 0 16 16" width="1em" height="1em" aria-hidden="true" focusable="false">
        <path
          d="M4 4l8 8M12 4l-8 8"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
          stroke-linecap="round"
        />
      </svg>
    </button>
  {/if}
</span>

<style>
  .tag {
    display: inline-flex;
    align-items: center;
    gap: var(--ds-tag-gap, 0.3rem);
    padding: var(--ds-tag-padding, 0.15rem 0.5rem);
    font: inherit;
    font-size: var(--ds-tag-font-size, 0.8125rem);
    font-weight: 500;
    line-height: 1.4;
    white-space: nowrap;
    border: 1px solid var(--_border, transparent);
    border-radius: var(--ds-tag-radius, var(--ds-radius-control, 0.375rem));
    background: var(--_bg);
    color: var(--_fg);
  }
  .tag[data-size="sm"] {
    font-size: var(--ds-tag-font-size-sm, 0.75rem);
    padding: var(--ds-tag-padding-sm, 0.05rem 0.4rem);
  }

  .tag__icon,
  .tag__trailing {
    display: inline-flex;
    align-items: center;
    inline-size: 1em;
    block-size: 1em;
  }
  .tag__icon :global(svg),
  .tag__trailing :global(svg) {
    inline-size: 100%;
    block-size: 100%;
  }

  .tag__remove {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin: 0;
    margin-inline-end: -0.15rem;
    padding: 0.1rem;
    font: inherit;
    color: inherit;
    background: none;
    border: 0;
    border-radius: 999px;
    cursor: pointer;
    opacity: 0.7;
    transition:
      opacity 120ms ease,
      background-color 120ms ease;
  }
  .tag__remove:hover {
    opacity: 1;
    background: var(--ds-tag-remove-hover, rgba(0, 0, 0, 0.1));
  }
  .tag__remove:focus-visible {
    opacity: 1;
    outline: none;
    box-shadow: var(--ds-focus-ring-shadow);
    outline-offset: 1px;
  }

  /* Soft, status-tinted surface. data-status/data-variant are dynamic, so the
     value part is :global to avoid Svelte's unused-selector pruning. */
  .tag:global([data-variant="soft"][data-status="neutral"]) {
    --_bg: var(--ds-color-neutral-surface, #f1f5f9);
    --_fg: var(--ds-color-neutral-text, #334155);
    --_border: var(--ds-color-neutral-border, #e2e8f0);
  }
  .tag:global([data-variant="soft"][data-status="selected"]) {
    --_bg: color-mix(in srgb, var(--ds-color-secondary, #7b52cc) 12%, transparent);
    --_fg: var(--ds-color-secondary, #7b52cc);
    --_border: color-mix(in srgb, var(--ds-color-secondary, #7b52cc) 30%, transparent);
  }
  .tag:global([data-variant="soft"][data-status="info"]) {
    --_bg: var(--ds-color-info-surface, #eff6ff);
    --_fg: var(--ds-color-info-text, #1d4ed8);
    --_border: var(--ds-color-info-border, #bfdbfe);
  }
  .tag:global([data-variant="soft"][data-status="success"]) {
    --_bg: var(--ds-color-success-surface, #f0fdf4);
    --_fg: var(--ds-color-success-text, #15803d);
    --_border: var(--ds-color-success-border, #bbf7d0);
  }
  .tag:global([data-variant="soft"][data-status="warning"]) {
    --_bg: var(--ds-color-warning-surface, #fffbeb);
    --_fg: var(--ds-color-warning-text, #b45309);
    --_border: var(--ds-color-warning-border, #fde68a);
  }
  .tag:global([data-variant="soft"][data-status="danger"]) {
    --_bg: var(--ds-color-danger-surface, #fef2f2);
    --_fg: var(--ds-color-danger-text, #b91c1c);
    --_border: var(--ds-color-danger-border, #fecaca);
  }

  /* Solid, filled chip. */
  .tag:global([data-variant="solid"][data-status="neutral"]) {
    --_bg: var(--ds-color-neutral, #475569);
    --_fg: var(--ds-color-on-neutral, #fff);
  }
  .tag:global([data-variant="solid"][data-status="info"]) {
    --_bg: var(--ds-color-info, #2563eb);
    --_fg: var(--ds-color-on-info, #fff);
  }
  .tag:global([data-variant="solid"][data-status="success"]) {
    --_bg: var(--ds-color-success, #16a34a);
    --_fg: var(--ds-color-on-success, #fff);
  }
  .tag:global([data-variant="solid"][data-status="warning"]) {
    --_bg: var(--ds-color-warning, #d97706);
    --_fg: var(--ds-color-on-warning, #fff);
  }
  .tag:global([data-variant="solid"][data-status="danger"]) {
    --_bg: var(--ds-color-danger, #dc2626);
    --_fg: var(--ds-color-on-danger, #fff);
  }
  .tag:global([data-variant="solid"][data-status="selected"]) {
    --_bg: var(--ds-color-secondary, #7b52cc);
    --_fg: var(--ds-color-on-secondary, #fff);
  }
</style>
