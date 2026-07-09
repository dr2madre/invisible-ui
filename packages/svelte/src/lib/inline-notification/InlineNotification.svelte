<script lang="ts" context="module">
  let inlineNotificationCount = 0;
</script>

<script lang="ts">
  /**
   * Alert — a banner that communicates a feedback message, composed from the
   * existing building blocks: a FeedbackIcon (status), a title, body text, an
   * optional link, and an optional close button.
   *
   * Accessibility:
   * - The container is a live region. `role` defaults to `"status"` (polite);
   *   pass `role="alert"` for urgent, interrupting messages. The title names
   *   the container via `aria-labelledby` (required when `role="region"`).
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
  import Button from "../button/Button.svelte";
  import Icon from "../icon/Icon.svelte";
  import { getI18n } from "../i18n/create-i18n";
  import type { ButtonVariant } from "../button/create-button";

  const { t } = getI18n();
  const titleId = `ds-alert-${++inlineNotificationCount}-title`;

  /** A data-driven action button (alternative to the `actions` slot). */
  interface AlertAction {
    label: string;
    variant?: ButtonVariant;
    onClick?: () => void;
  }

  type FeedbackStatus = "info" | "success" | "warning" | "danger" | "neutral";

  /** Feedback status: `info` | `success` | `warning` | `danger` | `neutral`. */
  export let status: FeedbackStatus = "info";
  /** Heading (required). */
  export let title: string;
  /** Body text (required). Override with the default slot for rich content. */
  export let description: string;
  /** Link href. When set (and no `link` slot is provided) a link is rendered. */
  export let href: string | undefined = undefined;
  /** Link text. Defaults to the i18n catalog's "Learn more". */
  export let linkText: string | undefined = undefined;
  /** Action buttons (alternative to the `actions` slot). */
  export let actions: AlertAction[] | undefined = undefined;
  /** Render the close button. Defaults to `false` (not dismissible). */
  export let closable = false;
  /** Close button accessible name. Defaults to the i18n catalog's "Close". */
  export let closeLabel: string | undefined = undefined;
  /**
   * Controls visibility (bindable). Dismissing sets it to `false`; set it back
   * to `true` to show the alert again.
   */
  export let open = true;
  /** Live-region role. `"status"` (polite) by default; `"alert"` for urgent. */
  export let role: "status" | "alert" | "region" = "status";
  /** High-contrast inverse surface (opposite of the page) for maximum visibility. */
  export let inverted = false;
  /**
   * No-surface variant: drop the tinted background and border (the message sits
   * on the page). The status stays visible via the colored FeedbackIcon chip.
   */
  export let plain = false;
  /** Shape of the FeedbackIcon box — `"rounded"` (default) or a full `"round"` circle. */
  export let iconShape: "rounded" | "round" = "rounded";
  /**
   * FeedbackIcon box override. By default the box is tinted on plain/inverted
   * alerts and transparent on tinted surfaces (so it doesn't clash); set
   * `"tint"` or `"solid"` to force a visible chip on a tinted surface too.
   */
  export let iconBox: "tint" | "transparent" | "solid" | undefined = undefined;
  /**
   * Snackbar layout: one compact, vertically-centered row — icon, title and
   * inline actions — in a container that wraps its content. The description is
   * dropped and the icon takes the text color with no box. Meant for the
   * floating `Notification`, not the in-page banner.
   */
  export let snack = false;
  /** Called when dismissed. */
  export let onclose: (() => void) | undefined = undefined;

  function close() {
    open = false;
    onclose?.();
  }

  $: resolvedLinkText = linkText ?? $t("inlineNotification.learnMore");
  $: resolvedCloseLabel = closeLabel ?? $t("inlineNotification.close");
</script>

{#if open}
  <!-- Pointer/focus events are forwarded so a Notice can pause its
       auto-dismiss countdown on the live region itself (no extra wrapper). -->
  <div
    class="inline-notification"
    data-status={status}
    data-inverted={inverted ? "" : undefined}
    data-plain={plain ? "" : undefined}
    data-snack={snack ? "" : undefined}
    {role}
    aria-labelledby={title ? titleId : undefined}
    on:mouseenter
    on:mouseleave
    on:focusin
    on:focusout
  >
    <!-- On the plain (no-surface) variant the colored chip carries the status; on
         a tinted surface the chip box goes transparent so it doesn't clash. Pass
         a custom glyph via the `icon` slot (forwarded to the FeedbackIcon). -->
    {#if $$slots.icon}
      <FeedbackIcon
        {status}
        shape={iconShape}
        box={iconBox ?? (snack ? "transparent" : plain || inverted ? "tint" : "transparent")}
      >
        <slot name="icon" />
      </FeedbackIcon>
    {:else}
      <FeedbackIcon
        {status}
        shape={iconShape}
        box={iconBox ?? (snack ? "transparent" : plain || inverted ? "tint" : "transparent")}
      />
    {/if}

    <div class="inline-notification__content">
      {#if title}
        <p class="inline-notification__title" id={titleId}>{title}</p>
      {/if}

      {#if !snack && (description || $$slots.default)}
        <div class="inline-notification__body"><slot>{description}</slot></div>
      {/if}

      {#if $$slots.link}
        <slot name="link" />
      {:else if href}
        <a class="inline-notification__link" {href}>{resolvedLinkText}</a>
      {/if}

      {#if actions?.length || $$slots.actions}
        <div class="inline-notification__actions">
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
      <span class="inline-notification__close">
        <Button iconOnly variant="ghost" ariaLabel={resolvedCloseLabel} onpress={close}>
          <Icon>
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </Icon>
        </Button>
      </span>
    {/if}
  </div>
{/if}

<style>
  .inline-notification {
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
  .inline-notification:has(.inline-notification__close) {
    padding-inline-end: 2.5rem;
  }
  .inline-notification__close {
    position: absolute;
    inset-block-start: 0.5rem;
    inset-inline-end: 0.5rem;
    /* Ghost icon Button sized to a square WCAG 2.5.8 hit area. It stays
       color-neutral (inherits the surface's own text color) so it works on any
       status-tinted or inverted surface. */
    --ds-button-icon-min: var(--ds-close-hit-area, 2.5rem);
    --ds-button-icon-size: var(--ds-close-icon-size, 1rem);
    color: var(--ds-close-color, inherit);
  }

  .inline-notification__content {
    flex: 1;
    min-inline-size: 0;
    display: grid;
    gap: 0.25rem;
  }

  .inline-notification__title {
    margin: 0;
    font-weight: 600;
    line-height: 1.3;
  }

  .inline-notification__body {
    margin: 0;
    line-height: 1.45;
  }

  .inline-notification__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-block-start: 0.5rem;
  }

  .inline-notification__link {
    justify-self: start;
    margin-block-start: 0.25rem;
    color: inherit;
    font-weight: 600;
    text-decoration: underline;
    text-underline-offset: 2px;
  }
  .inline-notification__link:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring-shadow);
    outline-offset: 2px;
    border-radius: 2px;
  }

  /* Soft, status-tinted surface. data-status is dynamic, so the value part is
     :global to avoid the Svelte unused-selector pruning. */
  .inline-notification:global([data-status="info"]) {
    --_bg: var(--ds-color-info-surface, #eff6ff);
    --_border: var(--ds-color-info-border, #bfdbfe);
  }
  .inline-notification:global([data-status="success"]) {
    --_bg: var(--ds-color-success-surface, #f0fdf4);
    --_border: var(--ds-color-success-border, #bbf7d0);
  }
  .inline-notification:global([data-status="warning"]) {
    --_bg: var(--ds-color-warning-surface, #fffbeb);
    --_border: var(--ds-color-warning-border, #fde68a);
  }
  .inline-notification:global([data-status="danger"]) {
    --_bg: var(--ds-color-danger-surface, #fef2f2);
    --_border: var(--ds-color-danger-border, #fecaca);
  }
  .inline-notification:global([data-status="neutral"]) {
    --_bg: var(--ds-color-neutral-surface, #f8fafc);
    --_border: var(--ds-color-neutral-border, #e2e8f0);
  }

  /* Inverted: a high-contrast surface that ignores the status tint (the status
     stays visible via the colored FeedbackIcon). Wins over the rules above. */
  .inline-notification:global([data-inverted]) {
    --_bg: var(--ds-color-emphasis-surface, #1e293b);
    --_border: var(--ds-color-emphasis-border, #334155);
    --_fg: var(--ds-color-on-emphasis, #f8fafc);
  }

  /* Plain (no-surface): transparent background, no border. The colored
     FeedbackIcon chip carries the status. Wins over the status tint. Keeps the
     lateral padding so its content aligns with the surfaced alerts. */
  .inline-notification:global([data-plain]) {
    --_bg: transparent;
    --_border: transparent;
  }

  /* Snackbar: one compact row that wraps its content and centers everything
     vertically. Icon + title + inline actions on a single line; the icon
     takes the text color with no box (set transparent above). */
  .inline-notification:global([data-snack]) {
    inline-size: fit-content;
    /* Wrap the content on one line even past the region's column width, up to
       the viewport (the region clips only vertically, so this stays visible). */
    max-inline-size: calc(100vw - 2rem);
    margin-inline: auto;
    align-items: center;
    gap: 0.625rem;
    padding: var(--ds-snack-padding, 0.5rem 0.75rem 0.5rem 1rem);
    border-radius: var(--ds-snack-radius, var(--ds-radius-surface, 0.75rem));
  }
  /* The message stays on a single line, however long. */
  .inline-notification:global([data-snack]) .inline-notification__title {
    white-space: nowrap;
  }
  .inline-notification:global([data-snack]) .inline-notification__content {
    flex: 0 1 auto;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  .inline-notification:global([data-snack]) .inline-notification__actions {
    margin-block-start: 0;
    flex-wrap: nowrap;
  }
  /* Icon glyph in the text color (no status tint), no box. A slight pop on
     entrance (plays once on mount); disabled under reduced motion. */
  .inline-notification:global([data-snack]) :global(.feedback-icon) {
    color: inherit;
    inline-size: var(--ds-snack-icon-size, 1.25rem);
    block-size: var(--ds-snack-icon-size, 1.25rem);
    padding: 0;
    animation: ds-snack-icon-in 340ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
  }
  @keyframes ds-snack-icon-in {
    from {
      transform: scale(0.4);
      opacity: 0;
    }
    60% {
      transform: scale(1.12);
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .inline-notification:global([data-snack]) :global(.feedback-icon) {
      animation: none;
    }
  }
  /* Close, when present, sits inline in the row instead of pinned top-right. */
  .inline-notification:global([data-snack]):has(.inline-notification__close) {
    padding-inline-end: 0.5rem;
  }
  .inline-notification:global([data-snack]) .inline-notification__close {
    position: static;
    inset: auto;
    --ds-button-icon-min: var(--ds-close-hit-area, 2rem);
  }
</style>
