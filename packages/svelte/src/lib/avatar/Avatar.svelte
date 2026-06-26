<script module lang="ts">
  /** Derive up to two initials from a name (first + last word). */
  export function initialsOf(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
    return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
  }
</script>

<script lang="ts">
  /**
   * Avatar — a small account image that falls back to the account's initials
   * when no image is set or the image fails to load.
   *
   * `name` is required: it provides both the accessible name and the initials
   * fallback. The whole avatar is exposed as a single image to assistive tech
   * (`role="img"` + `aria-label`), so it reads the same whether the photo or the
   * initials are showing. Size/shape/colors are themeable (`--ds-avatar-*`).
   */
  export let name: string;
  /** Image URL. When absent or it fails to load, initials are shown. */
  export let src: string | undefined = undefined;
  /** Accessible name; defaults to `name`. */
  export let alt: string | undefined = undefined;
  export let size: "sm" | "md" | "lg" = "md";
  export let shape: "circle" | "square" = "circle";

  let failed = false;
  // Reset the failure flag if the src changes.
  $: if (src) failed = false;
  $: showImage = Boolean(src) && !failed;
  $: initials = initialsOf(name);
</script>

<span class="avatar" data-size={size} data-shape={shape} role="img" aria-label={alt ?? name}>
  {#if showImage}
    <img class="avatar__img" {src} alt="" on:error={() => (failed = true)} />
  {:else}
    <span class="avatar__initials" aria-hidden="true">{initials}</span>
  {/if}
</span>

<style>
  .avatar {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: none;
    overflow: hidden;
    inline-size: var(--ds-avatar-size, 2.5rem);
    block-size: var(--ds-avatar-size, 2.5rem);
    background: var(--ds-avatar-bg, var(--ds-color-surface, #f1f5f9));
    color: var(--ds-avatar-color, var(--ds-color-text-secondary, #64748b));
    font-weight: 600;
    line-height: 1;
    user-select: none;
  }
  .avatar:global([data-size="sm"]) {
    inline-size: var(--ds-avatar-size, 2rem);
    block-size: var(--ds-avatar-size, 2rem);
    font-size: 0.75rem;
  }
  .avatar:global([data-size="md"]) {
    inline-size: var(--ds-avatar-size, 2.5rem);
    block-size: var(--ds-avatar-size, 2.5rem);
    font-size: 0.875rem;
  }
  .avatar:global([data-size="lg"]) {
    inline-size: var(--ds-avatar-size, 3.5rem);
    block-size: var(--ds-avatar-size, 3.5rem);
    font-size: 1.125rem;
  }
  .avatar:global([data-shape="circle"]) {
    border-radius: 50%;
  }
  .avatar:global([data-shape="square"]) {
    border-radius: var(--ds-avatar-radius, var(--ds-radius-control, 0.5rem));
  }

  .avatar__img {
    inline-size: 100%;
    block-size: 100%;
    object-fit: cover;
    display: block;
  }
</style>
