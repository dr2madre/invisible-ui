<script lang="ts">
  /**
   * EmptyState — a centered message shown when there is no content to show
   * and nothing has failed: first run, an empty list, no search results.
   * The sibling of `ErrorState` (something *failed*): same layout, calmer
   * intent. The user needs to get started, so the action is an invitation
   * ("Add a project", "Clear filters"), never a recovery.
   *
   * Layout: an illustration area, a `title`, an optional `description`, and
   * an action area at the bottom. The illustration area accepts a bespoke
   * artwork via the `illustration` slot and falls back to the theme's
   * `FeedbackIcon` (neutral by default). The action area renders a single
   * `Button` from `actionLabel`/`onAction`, a configurable group from the
   * `actions` prop, or any custom content via the `actions` slot. Themeable
   * via `--ds-empty-state-*`.
   *
   * Accessibility: the region is a `role="status"` (polite live region), so
   * when content resolves to empty the change is announced without
   * interrupting. Meaning never rests on color alone: the title carries it
   * (WCAG 1.4.1).
   */
  import FeedbackIcon from "../feedback-icon/FeedbackIcon.svelte";
  import Button from "../button/Button.svelte";
  import Link from "../link/Link.svelte";
  import type { ButtonVariant } from "../button/create-button";

  /** The headline — what this space is for, in plain language. */
  export let title: string;
  /** Optional secondary line — detail or the suggested next step. */
  export let description: string | undefined = undefined;
  /** Feedback status driving the fallback icon's color and glyph. */
  export let status: "info" | "success" | "warning" | "danger" | "neutral" = "neutral";
  /** Heading level for the title, so it fits the surrounding document outline. */
  export let headingLevel: 1 | 2 | 3 | 4 | 5 | 6 = 2;
  /** Action button label (e.g. "Add a project"). Omit to render no button. */
  export let actionLabel: string | undefined = undefined;
  /** Called when the action button is pressed. */
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

<div class="empty-state" role="status" data-size={size}>
  <span class="empty-state__illustration">
    <slot name="illustration">
      <FeedbackIcon {status} box="tint" shape="round" />
    </slot>
  </span>

  <svelte:element this={`h${headingLevel}`} class="empty-state__title">
    {title}
  </svelte:element>

  {#if description}
    <p class="empty-state__description">{description}</p>
  {/if}

  <slot />

  {#if $$slots.actions || actions.length || actionLabel}
    <div class="empty-state__actions">
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
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: var(--ds-empty-state-gap, 0.75rem);
    padding: var(--ds-empty-state-padding, 3rem 1.5rem);
    max-inline-size: var(--ds-empty-state-max-width, 24rem);
    margin-inline: auto;
    color: var(--ds-color-text, #0f172a);
  }
  /* The illustration area: sized for the fallback icon, and a bespoke
     artwork stays within the same footprint unless the theme widens it. */
  .empty-state__illustration {
    --ds-feedback-icon-size: var(--ds-empty-state-icon-size, 3.5rem);
    max-inline-size: var(--ds-empty-state-illustration-max-width, 12rem);
    margin-block-end: 0.25rem;
  }
  .empty-state__title {
    margin: 0;
    font-size: var(--ds-empty-state-title-size, 1.25rem);
    font-weight: 700;
    line-height: var(--ds-line-height-tight, 1.2);
  }
  .empty-state__description {
    margin: 0;
    color: var(--ds-color-text-secondary, #64748b);
  }
  .empty-state__actions {
    margin-block-start: 0.5rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: center;
    align-items: center;
  }
  /* Compact density for cards, panels and table areas. */
  .empty-state[data-size="sm"] {
    gap: var(--ds-empty-state-gap, 0.5rem);
    padding: var(--ds-empty-state-padding, 1.5rem 1rem);
  }
  .empty-state[data-size="sm"] .empty-state__illustration {
    --ds-feedback-icon-size: var(--ds-empty-state-icon-size, 2.5rem);
  }
  .empty-state[data-size="sm"] .empty-state__title {
    font-size: var(--ds-empty-state-title-size, 1rem);
  }
</style>
