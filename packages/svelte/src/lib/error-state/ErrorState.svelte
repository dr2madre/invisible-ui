<script lang="ts">
  /**
   * ErrorState — a centered, full-page (or full-section) message shown when
   * something has gone wrong: a failed request, a 500, a lost connection. This
   * is an *error* state, distinct from an *empty* state (no content yet): use
   * this when an action or load failed and the user needs to recover.
   *
   * Layout: a status `FeedbackIcon` (danger by default), a `title`, an optional
   * `description`, and a recovery action area at the bottom: a single `Button`
   * from `actionLabel`/`onAction` (e.g. "Try again"), or a configurable group
   * from the `actions` prop. It is **not** dismissable: an error state
   * replaces the content it covers, so there is nothing to close.
   *
   * Reuses the existing `FeedbackIcon` and `Button`. Swap the icon for another
   * glyph or an ad-hoc illustration via the `icon` slot (e.g. a bespoke 404
   * artwork), or replace the whole action area via the `actions` slot. Themeable
   * via `--ds-error-state-*`.
   *
   * Accessibility: the region is a `role="alert"`, so when it appears it is
   * announced. Meaning never rests on color alone — the title (and the icon
   * glyph) carry it (WCAG 1.4.1).
   */
  import FeedbackIcon from "../feedback-icon/FeedbackIcon.svelte";
  import Button from "../button/Button.svelte";
  import Link from "../link/Link.svelte";
  import type { ButtonVariant } from "../button/create-button";

  /** The headline — what went wrong, in plain language. */
  export let title: string;
  /** Optional secondary line — detail or next step. */
  export let description: string | undefined = undefined;
  /** Feedback status driving the default icon's color and glyph. */
  export let status: "info" | "success" | "warning" | "danger" | "neutral" = "danger";
  /** Heading level for the title, so it fits the surrounding document outline. */
  export let headingLevel: 1 | 2 | 3 | 4 | 5 | 6 = 2;
  /** Recovery button label (e.g. "Try again"). Omit to render no button. */
  export let actionLabel: string | undefined = undefined;
  /** Called when the recovery button is pressed. */
  export let onAction: (() => void) | undefined = undefined;
  /**
   * Configurable action group. An entry with `href` renders a `Link` (a
   * direct pathway, e.g. "Learn more" documentation); the others render
   * `Button`s: the first gets the `default` variant and the rest `ghost`,
   * unless an entry sets its own `variant`. Takes precedence over
   * `actionLabel`; the `actions` slot replaces the whole area.
   */
  export let actions: {
    label: string;
    onAction?: () => void;
    variant?: ButtonVariant;
    href?: string;
    target?: string;
  }[] = [];
  /** Density: `md` for full pages and sections, `sm` inside cards, panels and table areas. */
  export let size: "md" | "sm" = "md";
</script>

<div class="error-state" role="alert" data-size={size}>
  <span class="error-state__icon">
    <slot name="icon">
      <FeedbackIcon {status} box="tint" shape="round" />
    </slot>
  </span>

  <svelte:element this={`h${headingLevel}`} class="error-state__title">
    {title}
  </svelte:element>

  {#if description}
    <p class="error-state__description">{description}</p>
  {/if}

  <slot />

  {#if $$slots.actions || actions.length || actionLabel}
    <div class="error-state__actions">
      <slot name="actions">
        {#if actions.length}
          {#each actions as action, index (action.label)}
            {#if action.href}
              <Link href={action.href} target={action.target} on:click={action.onAction}>
                {action.label}
              </Link>
            {:else}
              <Button
                variant={action.variant ?? (index === 0 ? "default" : "ghost")}
                onpress={action.onAction}
              >
                {action.label}
              </Button>
            {/if}
          {/each}
        {:else if actionLabel}
          <Button variant="default" onpress={onAction}>{actionLabel}</Button>
        {/if}
      </slot>
    </div>
  {/if}
</div>

<style>
  .error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: var(--ds-error-state-gap, 0.75rem);
    padding: var(--ds-error-state-padding, 3rem 1.5rem);
    max-inline-size: var(--ds-error-state-max-width, 24rem);
    margin-inline: auto;
    color: var(--ds-color-text, #0f172a);
  }
  /* A larger status icon than the inline default — this is the focal point. */
  .error-state__icon {
    --ds-feedback-icon-size: var(--ds-error-state-icon-size, 3.5rem);
    margin-block-end: 0.25rem;
  }
  .error-state__title {
    margin: 0;
    font-size: var(--ds-error-state-title-size, 1.25rem);
    font-weight: 700;
    line-height: var(--ds-line-height-tight, 1.2);
  }
  .error-state__description {
    margin: 0;
    color: var(--ds-color-text-secondary, #64748b);
  }
  .error-state__actions {
    margin-block-start: 0.5rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: center;
    align-items: center;
  }
  /* Compact density for cards, panels and table areas. */
  .error-state[data-size="sm"] {
    gap: var(--ds-error-state-gap, 0.5rem);
    padding: var(--ds-error-state-padding, 1.5rem 1rem);
  }
  .error-state[data-size="sm"] .error-state__icon {
    --ds-feedback-icon-size: var(--ds-error-state-icon-size, 2.5rem);
  }
  .error-state[data-size="sm"] .error-state__title {
    font-size: var(--ds-error-state-title-size, 1rem);
  }
</style>
