<script module lang="ts">
  export interface AvatarGroupItem {
    /** Required: accessible name + initials fallback. */
    name: string;
    /** Image URL; falls back to initials when absent or it fails to load. */
    src?: string;
    /** Accessible name override; defaults to `name`. */
    alt?: string;
  }
</script>

<script lang="ts">
  /**
   * AvatarGroup — a row of overlapping avatars (a team, attendees, collaborators).
   * Caps the visible count at `max` and renders a "+N" overflow chip for the rest.
   *
   * Accessibility:
   * - The row is a labelled group (`role="group"` + `label`) so assistive tech
   *   announces what the cluster represents.
   * - Each avatar keeps its own accessible name (via `Avatar`); the overflow chip
   *   exposes how many more there are ("N more").
   *
   * Overlap, ring, size and shape are themeable CSS custom properties
   * (`--ds-avatar-group-*`), inheriting the `Avatar` tokens.
   */
  import Avatar from "../avatar/Avatar.svelte";

  /** The people in the group. */
  export let items: AvatarGroupItem[];
  /** Maximum avatars to show before collapsing the rest into a "+N" chip. */
  export let max = 4;
  export let size: "sm" | "md" | "lg" = "md";
  export let shape: "circle" | "square" = "circle";
  /** Accessible name for the group (announced by screen readers). */
  export let label: string;

  $: visible = items.slice(0, max);
  $: overflow = Math.max(0, items.length - visible.length);
</script>

<div class="avatar-group" data-size={size} data-shape={shape} role="group" aria-label={label}>
  {#each visible as item (item.name)}
    <span class="avatar-group__item">
      <Avatar name={item.name} src={item.src} alt={item.alt} {size} {shape} />
    </span>
  {/each}
  {#if overflow > 0}
    <span
      class="avatar-group__item avatar-group__overflow"
      data-size={size}
      data-shape={shape}
      role="img"
      aria-label={`${overflow} more`}
    >
      <span aria-hidden="true">+{overflow}</span>
    </span>
  {/if}
</div>

<style>
  .avatar-group {
    display: inline-flex;
    flex-direction: row;
    align-items: center;
  }

  /* Overlap each avatar over its predecessor; a ring separates them. */
  .avatar-group__item {
    display: inline-flex;
    border-radius: inherit;
    /* No separator ring by default — avatars overlap directly. Opt into one
       (e.g. for photo avatars) by setting --ds-avatar-group-ring-width to a
       non-zero value; the ring color should match the background the group sits
       on so it only separates avatars and stays invisible at the outer edge. */
    box-shadow: 0 0 0 var(--ds-avatar-group-ring-width, 0)
      var(--ds-avatar-group-ring-color, var(--ds-color-background, #fff));
  }
  .avatar-group__item:not(:first-child) {
    margin-inline-start: var(--ds-avatar-group-overlap, -0.625rem);
  }

  /* Stack order: earlier avatars sit above later ones so the overlap reads
     left-to-right; the overflow chip stays on top. */
  .avatar-group__item {
    position: relative;
    z-index: 0;
  }

  .avatar-group__overflow {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: none;
    inline-size: var(--ds-avatar-size, 2.5rem);
    block-size: var(--ds-avatar-size, 2.5rem);
    font-size: 0.8125rem;
    font-weight: 600;
    line-height: 1;
    user-select: none;
    background: var(--ds-avatar-group-overflow-bg, var(--ds-color-neutral-surface, #e2e8f0));
    color: var(--ds-avatar-group-overflow-color, var(--ds-color-text-secondary, #475569));
  }
  .avatar-group__overflow:global([data-size="sm"]) {
    inline-size: var(--ds-avatar-size, 2rem);
    block-size: var(--ds-avatar-size, 2rem);
    font-size: 0.6875rem;
  }
  .avatar-group__overflow:global([data-size="lg"]) {
    inline-size: var(--ds-avatar-size, 3.5rem);
    block-size: var(--ds-avatar-size, 3.5rem);
    font-size: 1rem;
  }
  .avatar-group__overflow:global([data-shape="circle"]) {
    border-radius: 50%;
  }
  .avatar-group__overflow:global([data-shape="square"]) {
    border-radius: var(--ds-avatar-radius, var(--ds-radius-control, 0.5rem));
  }
</style>
