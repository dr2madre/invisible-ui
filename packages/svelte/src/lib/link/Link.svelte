<script lang="ts">
  /**
   * Link — a styled inline text link rendered with a semantic `<a>`.
   *
   * Violet and underlined by default (the brand selection colour), with a clear
   * hover/focus treatment. Set `external` for links that open in a new tab — it
   * adds `target="_blank"` + safe `rel`, and an arrow icon marks it visually.
   * When no `href` is given it renders a non-navigating link (e.g. a disabled or
   * JS-driven link) that is still keyboardable when an `onpress` is supplied.
   *
   * Presentational only — themeable via `--ds-link-*`.
   */
  /** Destination URL. */
  export let href: string | undefined = undefined;
  /** Open in a new tab (adds target/rel and a trailing arrow icon). */
  export let external = false;
  /** Tone down to the surrounding text colour (still underlined on hover). */
  export let variant: "primary" | "subtle" = "primary";
  /** Optional press handler (useful when there is no `href`). */
  export let onpress: ((event: MouseEvent) => void) | undefined = undefined;

  $: rel = external ? "noopener noreferrer" : undefined;
  $: target = external ? "_blank" : undefined;
</script>

<a class="link" data-variant={variant} {href} {target} {rel} on:click={onpress} {...$$restProps}>
  <slot />
  {#if external}
    <svg
      class="link__external"
      viewBox="0 0 24 24"
      width="0.85em"
      height="0.85em"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M7 17 17 7" />
      <path d="M8 7h9v9" />
    </svg>
  {/if}
</a>

<style>
  .link {
    color: var(--ds-link-color, var(--ds-color-secondary, #7b52cc));
    text-decoration: underline;
    text-decoration-thickness: var(--ds-link-underline, 1px);
    text-underline-offset: 0.15em;
    border-radius: 0.15em;
    cursor: pointer;
    transition:
      color 120ms ease,
      text-decoration-color 120ms ease;
  }
  .link[data-variant="subtle"] {
    color: inherit;
    text-decoration-color: var(--ds-color-border, #cbd5e1);
  }
  .link:hover {
    color: var(--ds-link-hover, var(--ds-color-secondary-600, #5a3a9e));
    text-decoration-color: currentColor;
  }
  .link:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring-shadow, 0 0 0 2px var(--ds-color-focus-ring, #7b52cc));
  }
  .link__external {
    display: inline-block;
    margin-inline-start: 0.15em;
    vertical-align: baseline;
  }
</style>
