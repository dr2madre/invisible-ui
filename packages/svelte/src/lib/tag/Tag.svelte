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
  import { getI18n } from "../i18n/create-i18n";

  const { t } = getI18n();

  type TagStatus = "neutral" | "info" | "success" | "warning" | "danger" | "selected";

  /** Status/tone: `neutral` | `info` | `success` | `warning` | `danger` | `selected`. */
  export let status: TagStatus = "neutral";
  /** Visual weight: a soft tinted surface (default) or a solid, filled chip. */
  export let variant: "soft" | "solid" = "soft";
  /** Size of the chip. */
  export let size: "sm" | "md" = "md";
  /** Render a remove (✕) button. Defaults to `false`. */
  export let removable = false;
  /** Accessible name for the remove button. Defaults to the i18n catalog's "Remove". */
  export let removeLabel: string | undefined = undefined;
  /** Called when the remove button is pressed. */
  export let onRemove: (() => void) | undefined = undefined;

  $: resolvedRemoveLabel = removeLabel ?? $t("tag.remove");
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
      aria-label={resolvedRemoveLabel}
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
    /* Tall enough for the remove button's 24px target to sit inside the tag. */
    min-block-size: 1.5rem;
    gap: var(--ds-tag-gap, 0.3rem);
    padding: var(--ds-tag-padding, 0.15rem 0.5rem);
    font: inherit;
    font-size: var(--ds-tag-font-size, 0.8125rem);
    font-weight: 500;
    line-height: var(--ds-line-height-tight, 1.2);
    white-space: nowrap;
    border: 1px solid var(--_border, transparent);
    border-radius: var(--ds-tag-radius, var(--ds-radius-control, 0.5rem));
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
    /* The glyph keeps its size; the pressable area is at least 24px square. */
    inline-size: 1.5rem;
    block-size: 1.5rem;
    flex: none;
    padding: 0;
    font: inherit;
    color: inherit;
    background: none;
    border: 0;
    border-radius: 999px;
    cursor: pointer;
    opacity: 0.7;
    transition: opacity 120ms ease;
  }
  /* Hover strengthens the glyph only — no background fill. */
  .tag__remove:hover {
    opacity: 1;
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
    --_bg: var(--ds-color-neutral-surface, #f4f2ef);
    --_fg: var(--ds-color-neutral-text, #413c36);
    --_border: var(--ds-color-neutral-border, #c7c1b7);
  }
  .tag:global([data-variant="soft"][data-status="selected"]) {
    --_bg: color-mix(in srgb, var(--ds-color-secondary, #7a52cc) 8%, transparent);
    --_fg: var(--ds-color-selected-text, #553d7f);
    --_border: color-mix(in srgb, var(--ds-color-secondary, #7a52cc) 22%, transparent);
  }
  .tag:global([data-variant="soft"][data-status="info"]) {
    --_bg: var(--ds-color-info-surface, #f0f3f9);
    --_fg: var(--ds-color-info-text, #344468);
    --_border: var(--ds-color-info-border, #c6d1e9);
  }
  .tag:global([data-variant="soft"][data-status="success"]) {
    --_bg: var(--ds-color-success-surface, #f0f4ed);
    --_fg: var(--ds-color-success-text, #334e22);
    --_border: var(--ds-color-success-border, #c5d6bd);
  }
  .tag:global([data-variant="soft"][data-status="warning"]) {
    --_bg: var(--ds-color-warning-surface, #fbf3ed);
    --_fg: var(--ds-color-warning-text, #6c3f21);
    --_border: var(--ds-color-warning-border, #efd1bd);
  }
  .tag:global([data-variant="soft"][data-status="danger"]) {
    --_bg: var(--ds-color-danger-surface, #faeff1);
    --_fg: var(--ds-color-danger-text, #7f313c);
    --_border: var(--ds-color-danger-border, #ecc4cb);
  }

  /* Solid, filled chip. */
  .tag:global([data-variant="solid"][data-status="neutral"]) {
    --_bg: var(--ds-color-neutral, #5e5951);
    --_fg: var(--ds-color-on-status, #fff);
  }
  .tag:global([data-variant="solid"][data-status="info"]) {
    --_bg: var(--ds-color-info, #4067b6);
    --_fg: var(--ds-color-on-status, #fff);
  }
  .tag:global([data-variant="solid"][data-status="success"]) {
    --_bg: var(--ds-color-success, #3e7523);
    --_fg: var(--ds-color-on-status, #fff);
  }
  .tag:global([data-variant="solid"][data-status="warning"]) {
    --_bg: var(--ds-color-warning, #c96422);
    --_fg: var(--ds-color-on-warning, #282420);
  }
  .tag:global([data-variant="solid"][data-status="danger"]) {
    --_bg: var(--ds-color-danger, #be3b50);
    --_fg: var(--ds-color-on-status, #fff);
  }
  .tag:global([data-variant="solid"][data-status="selected"]) {
    --_bg: var(--ds-color-secondary, #7a52cc);
    --_fg: var(--ds-color-on-secondary, #fff);
  }
</style>
