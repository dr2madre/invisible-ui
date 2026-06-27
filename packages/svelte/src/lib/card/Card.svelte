<script module lang="ts">
  let _uid = 0;
</script>

<script lang="ts">
  /**
   * Card — a presentational content container. Three shapes from one component:
   *
   * - `variant="media"` + `orientation="vertical"` (default): the classic card —
   *   media on top, then tags, title, description, and a footer for actions.
   * - `variant="media"` + `orientation="horizontal"`: media on the left, the
   *   title with a tag beside it and the description below, actions on the right.
   * - `variant="dashboard"`: an icon over a title on the left, a large value with
   *   a smaller change/percentage beside it on the right (a metric tile).
   *
   * The media area is an image (`imageSrc`) or, when the `icon` slot is provided,
   * an icon in its place. Tags and actions are slots so you compose them with the
   * existing `Tag` and `ButtonGroup`/`Button` components (e.g. a ghost action on
   * the left and the primary action on the right).
   *
   * Accessibility: renders as an `<article>`; when a `title` prop is given it
   * becomes a heading (level via `headingLevel`) and labels the card
   * (`aria-labelledby`). Colors/spacing are themeable (`--ds-card-*`).
   */
  export let variant: "media" | "dashboard" = "media";
  export let orientation: "vertical" | "horizontal" = "vertical";
  /** Image URL for the media area (ignored when the `icon` slot is used). */
  export let imageSrc: string | undefined = undefined;
  /** Alt text for the image. Defaults to empty (decorative). */
  export let imageAlt = "";
  /** Card title; rendered as a heading and used to label the card. */
  export let title: string | undefined = undefined;
  /** Heading level for the title (2–6). Defaults to `3`. */
  export let headingLevel: 2 | 3 | 4 | 5 | 6 = 3;
  /** Body description text (override with the `description` slot for rich content). */
  export let description: string | undefined = undefined;
  /** Dashboard: the large metric value. */
  export let value: string | number | undefined = undefined;
  /** Dashboard: the smaller change/percentage shown beside the value. */
  export let change: string | undefined = undefined;
  /** Dashboard: direction of the change, for coloring. */
  export let trend: "up" | "down" | "neutral" = "neutral";

  const titleId = `ds-card-${++_uid}`;
  $: labelledBy = title ? titleId : undefined;
  $: hasMedia = Boolean(imageSrc) || Boolean($$slots.icon) || Boolean($$slots.media);
</script>

{#if variant === "dashboard"}
  <article class="card card--dashboard" aria-labelledby={labelledBy}>
    <div class="card__dash-head">
      {#if $$slots.icon}
        <span class="card__icon" aria-hidden="true"><slot name="icon" /></span>
      {/if}
      {#if $$slots.title}
        <slot name="title" />
      {:else if title}
        <svelte:element this={`h${headingLevel}`} class="card__title" id={titleId}>
          {title}
        </svelte:element>
      {/if}
    </div>
    <div class="card__metric">
      {#if value != null}<span class="card__value">{value}</span>{/if}
      {#if change}<span class="card__change" data-trend={trend}>{change}</span>{/if}
      <slot name="metric" />
    </div>
  </article>
{:else}
  <article class="card card--media" data-orientation={orientation} aria-labelledby={labelledBy}>
    {#if hasMedia}
      <div
        class="card__media"
        class:card__media--icon={$$slots.icon && !imageSrc && !$$slots.media}
      >
        {#if $$slots.media}
          <slot name="media" />
        {:else if $$slots.icon}
          <span class="card__icon" aria-hidden="true"><slot name="icon" /></span>
        {:else if imageSrc}
          <img class="card__image" src={imageSrc} alt={imageAlt} />
        {/if}
      </div>
    {/if}

    <div class="card__body">
      <div class="card__head">
        {#if $$slots.title}
          <slot name="title" />
        {:else if title}
          <svelte:element this={`h${headingLevel}`} class="card__title" id={titleId}>
            {title}
          </svelte:element>
        {/if}
        {#if $$slots.tags}
          <div class="card__tags"><slot name="tags" /></div>
        {/if}
      </div>

      {#if description || $$slots.description}
        <div class="card__description"><slot name="description">{description}</slot></div>
      {/if}

      {#if $$slots.default}
        <div class="card__content"><slot /></div>
      {/if}
    </div>

    {#if $$slots.actions}
      <div class="card__actions"><slot name="actions" /></div>
    {/if}
  </article>
{/if}

<style>
  .card {
    box-sizing: border-box;
    background: var(--ds-card-bg, var(--ds-color-background, #fff));
    color: var(--ds-card-text, var(--ds-color-text, #0f172a));
    border: 1px solid var(--ds-card-border, var(--ds-color-border, #e2e8f0));
    border-radius: var(--ds-card-radius, var(--ds-radius-surface, 0.75rem));
    overflow: hidden;
  }

  /* ---- Media card, vertical (classic) ---- */
  .card--media {
    display: flex;
    flex-direction: column;
  }
  .card__media {
    flex: none;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--ds-card-media-bg, var(--ds-color-neutral-surface, #f1f5f9));
  }
  .card__image {
    display: block;
    inline-size: 100%;
    block-size: 100%;
    object-fit: cover;
  }
  .card__media--icon {
    padding: var(--ds-card-icon-padding, 1.5rem);
    color: var(--ds-card-icon-color, var(--ds-color-text-secondary, #64748b));
  }
  .card__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    inline-size: var(--ds-card-icon-size, 2.5rem);
    block-size: var(--ds-card-icon-size, 2.5rem);
  }
  .card__icon :global(svg) {
    inline-size: 100%;
    block-size: 100%;
  }

  .card__body {
    flex: 1;
    min-inline-size: 0;
    display: flex;
    flex-direction: column;
    gap: var(--ds-card-gap, 0.5rem);
    padding: var(--ds-card-padding, 1rem);
  }

  .card__head {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    min-inline-size: 0;
  }
  /* Vertical: tags sit above the title. */
  .card__tags {
    order: -1;
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }

  .card__title {
    margin: 0;
    font-size: var(--ds-card-title-size, 1.05rem);
    font-weight: 600;
    line-height: 1.3;
  }
  .card__description {
    margin: 0;
    color: var(--ds-card-description-text, var(--ds-color-text-secondary, #475569));
    line-height: 1.5;
  }
  .card__content {
    margin-block-start: 0.25rem;
  }

  .card__actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: var(--ds-card-actions-padding, 0.75rem 1rem);
    /* No footer divider by default — opt in via --ds-card-actions-border. */
    border-block-start: 1px solid var(--ds-card-actions-border, transparent);
  }

  /* ---- Media card, horizontal ---- */
  .card--media[data-orientation="horizontal"] {
    flex-direction: row;
    align-items: stretch;
  }
  .card--media[data-orientation="horizontal"] .card__media {
    inline-size: var(--ds-card-horizontal-media-size, 8rem);
    align-self: stretch;
  }
  .card--media[data-orientation="horizontal"] .card__media--icon {
    inline-size: auto;
    padding-inline: 1.25rem;
  }
  /* Horizontal: title and tag share a line, description sits below. */
  .card--media[data-orientation="horizontal"] .card__head {
    flex-direction: row;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .card--media[data-orientation="horizontal"] .card__tags {
    order: 0;
  }
  /* Horizontal: actions move to the right, vertically centered, no top border. */
  .card--media[data-orientation="horizontal"] .card__actions {
    align-items: center;
    justify-content: flex-end;
    border-block-start: 0;
    padding-inline-end: 1rem;
  }

  /* ---- Dashboard (metric tile) ---- */
  .card--dashboard {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    padding: var(--ds-card-padding, 1rem);
  }
  .card__dash-head {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-inline-size: 0;
  }
  .card--dashboard .card__icon {
    color: var(--ds-card-icon-color, var(--ds-color-text-secondary, #64748b));
    inline-size: var(--ds-card-dash-icon-size, 1.75rem);
    block-size: var(--ds-card-dash-icon-size, 1.75rem);
  }
  .card__metric {
    display: flex;
    align-items: baseline;
    gap: 0.4rem;
    white-space: nowrap;
  }
  .card__value {
    font-size: var(--ds-card-value-size, 1.75rem);
    font-weight: 700;
    line-height: 1;
  }
  .card__change {
    font-size: var(--ds-card-change-size, 0.8125rem);
    font-weight: 600;
  }
  .card__change[data-trend="up"] {
    color: var(--ds-color-success-text, var(--ds-color-success, #16a34a));
  }
  .card__change[data-trend="down"] {
    color: var(--ds-color-danger-text, var(--ds-color-danger, #dc2626));
  }
  .card__change[data-trend="neutral"] {
    color: var(--ds-color-text-secondary, #64748b);
  }
</style>
