<script lang="ts">
  /**
   * Alert — a banner that communicates a feedback message, composed from the
   * existing building blocks: a FeedbackIcon (status), a title, body text, an
   * optional link, and an optional close button.
   *
   * Accessibility:
   * - The container is a live region. `role` defaults to `"status"` (polite);
   *   pass `role="alert"` for urgent, interrupting messages.
   * - The FeedbackIcon is decorative (the message text carries the meaning); the
   *   status is also conveyed visually by color + glyph + surface tint, so it
   *   never relies on color alone.
   * - Not dismissible by default — set `closable` to render the ghost close
   *   button (WCAG-sized hit area, accessible name).
   *
   * Colors come from the theme token layer (`--ds-color-*`), so the surface
   * adapts to light/dark. Set `inverted` for a high-contrast surface (the
   * opposite of the page) — useful for transient notices.
   */
  import FeedbackIcon from "../feedback-icon/FeedbackIcon.svelte";
  import CloseButton from "../close-button/CloseButton.svelte";
  import Button from "../button/Button.svelte";
  import type { ButtonVariant } from "../button/create-button";

  /** A data-driven action button (alternative to the `actions` slot). */
  interface AlertAction {
    label: string;
    variant?: ButtonVariant;
    onClick?: () => void;
  }

  type FeedbackStatus = "info" | "success" | "warning" | "danger" | "neutral";

  export let status: FeedbackStatus = "info";
  /** Heading (required). */
  export let title: string;
  /** Body text (required). Override with the default slot for rich content. */
  export let description: string;
  /** Link href. When set (and no `link` slot is provided) a link is rendered. */
  export let href: string | undefined = undefined;
  export let linkText = "Learn more";
  /** Action buttons (alternative to the `actions` slot). */
  export let actions: AlertAction[] | undefined = undefined;
  /** Render the close button. Defaults to `false` (not dismissible). */
  export let closable = false;
  export let closeLabel = "Close";
  /** Live-region role. `"status"` (polite) by default; `"alert"` for urgent. */
  export let role: "status" | "alert" | "region" = "status";
  /** High-contrast inverse surface (opposite of the page) for maximum visibility. */
  export let inverted = false;
  /**
   * No-surface variant: drop the tinted background and border (the message sits
   * on the page). The status stays visible via the colored FeedbackIcon chip.
   */
  export let plain = false;
  /** Called when dismissed. */
  export let onclose: (() => void) | undefined = undefined;

  let dismissed = false;

  function close() {
    dismissed = true;
    onclose?.();
  }
</script>

{#if !dismissed}
  <!-- Pointer/focus events are forwarded so a Notice can pause its
       auto-dismiss countdown on the live region itself (no extra wrapper). -->
  <div
    class="alert"
    data-status={status}
    data-inverted={inverted ? "" : undefined}
    data-plain={plain ? "" : undefined}
    {role}
    on:mouseenter
    on:mouseleave
    on:focusin
    on:focusout
  >
    <!-- On the plain (no-surface) variant the colored chip carries the status; on
         a tinted surface the chip box goes transparent so it doesn't clash. -->
    <FeedbackIcon {status} box={plain || inverted ? "tint" : "transparent"} />

    <div class="alert__content">
      {#if title}
        <p class="alert__title">{title}</p>
      {/if}

      {#if description || $$slots.default}
        <div class="alert__body"><slot>{description}</slot></div>
      {/if}

      {#if $$slots.link}
        <slot name="link" />
      {:else if href}
        <a class="alert__link" {href}>{linkText}</a>
      {/if}

      {#if actions?.length || $$slots.actions}
        <div class="alert__actions">
          {#if actions?.length}
            {#each actions as action (action.label)}
              <Button variant={action.variant ?? "ghost"} onpress={() => action.onClick?.()}>
                {action.label}
              </Button>
            {/each}
          {:else}
            <slot name="actions" />
          {/if}
        </div>
      {/if}
    </div>

    {#if closable}
      <span class="alert__close">
        <CloseButton label={closeLabel} onclose={close} />
      </span>
    {/if}
  </div>
{/if}

<style>
  .alert {
    position: relative;
    display: flex;
    gap: 0.75rem;
    align-items: flex-start;
    padding: var(--ds-alert-padding, 0.875rem 1rem);
    border: 1px solid var(--_border);
    border-radius: var(--ds-alert-radius, var(--ds-radius-surface, 0.75rem));
    background: var(--_bg);
    color: var(--_fg, var(--ds-color-text, #0f172a));
  }
  /* Pin the close button to the top-right; reserve room so text never runs under it. */
  .alert:has(.alert__close) {
    padding-inline-end: 2.5rem;
  }
  .alert__close {
    position: absolute;
    inset-block-start: 0.5rem;
    inset-inline-end: 0.5rem;
  }

  .alert__content {
    flex: 1;
    min-inline-size: 0;
    display: grid;
    gap: 0.25rem;
  }

  .alert__title {
    margin: 0;
    font-weight: 600;
    line-height: 1.3;
  }

  .alert__body {
    margin: 0;
    line-height: 1.45;
  }

  .alert__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-block-start: 0.5rem;
  }

  .alert__link {
    justify-self: start;
    margin-block-start: 0.25rem;
    color: inherit;
    font-weight: 600;
    text-decoration: underline;
    text-underline-offset: 2px;
  }
  .alert__link:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring-shadow);
    outline-offset: 2px;
    border-radius: 2px;
  }

  /* Soft, status-tinted surface. data-status is dynamic, so the value part is
     :global to avoid the Svelte unused-selector pruning. */
  .alert:global([data-status="info"]) {
    --_bg: var(--ds-color-info-surface, #eff6ff);
    --_border: var(--ds-color-info-border, #bfdbfe);
  }
  .alert:global([data-status="success"]) {
    --_bg: var(--ds-color-success-surface, #f0fdf4);
    --_border: var(--ds-color-success-border, #bbf7d0);
  }
  .alert:global([data-status="warning"]) {
    --_bg: var(--ds-color-warning-surface, #fffbeb);
    --_border: var(--ds-color-warning-border, #fde68a);
  }
  .alert:global([data-status="danger"]) {
    --_bg: var(--ds-color-danger-surface, #fef2f2);
    --_border: var(--ds-color-danger-border, #fecaca);
  }
  .alert:global([data-status="neutral"]) {
    --_bg: var(--ds-color-neutral-surface, #f8fafc);
    --_border: var(--ds-color-neutral-border, #e2e8f0);
  }

  /* Inverted: a high-contrast surface that ignores the status tint (the status
     stays visible via the colored FeedbackIcon). Wins over the rules above. */
  .alert:global([data-inverted]) {
    --_bg: var(--ds-color-emphasis-surface, #1e293b);
    --_border: var(--ds-color-emphasis-border, #334155);
    --_fg: var(--ds-color-on-emphasis, #f8fafc);
  }

  /* Plain (no-surface): transparent background, no border. The colored
     FeedbackIcon chip carries the status. Wins over the status tint. */
  .alert:global([data-plain]) {
    --_bg: transparent;
    --_border: transparent;
    padding-inline: 0;
  }
</style>
