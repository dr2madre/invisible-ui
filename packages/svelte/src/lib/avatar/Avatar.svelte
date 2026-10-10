<script module lang="ts">
  import { avatar } from "@design-system/core";

  /**
   * Up to two initials from a name (first and last word), counted in
   * user-perceived characters. The logic lives in `@design-system/core`.
   */
  export function initialsOf(name: string): string {
    return avatar.initialsOf(name);
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
  interface Props {
    name: string;
    /** Image URL. When absent or it fails to load, initials are shown. */
    src?: string;
    /** Accessible name; defaults to `name`. */
    alt?: string;
    size?: "sm" | "md" | "lg";
    shape?: "circle" | "square";
  }

  let { name, src, alt, size = "md", shape = "circle" }: Props = $props();

  // Set when the image fails to load; a new src clears it and tries again.
  let failed = $derived.by(() => {
    void src;
    return false;
  });
  const showImage = $derived(Boolean(src) && !failed);
  const initials = $derived(initialsOf(name));
</script>

<span class="avatar" data-size={size} data-shape={shape} role="img" aria-label={alt ?? name}>
  {#if showImage}
    <img class="avatar__img" {src} alt="" onerror={() => (failed = true)} />
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
    background-color: var(--ds-avatar-bg, var(--ds-color-surface, #e6e0d8));
    color: var(--ds-avatar-color, var(--ds-color-text, #282420));
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
