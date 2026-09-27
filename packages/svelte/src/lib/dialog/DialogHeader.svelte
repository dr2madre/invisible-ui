<script lang="ts">
  /**
   * DialogHeader — the header every dialog in the family shares (internal).
   *
   * Columns: optional feedback icon, optional ghost button (e.g. back), the
   * title block, optional actions, optional close button. The title block
   * stacks optional context, the title and an optional subtitle; every side
   * item is centered against it. The dialog owns the wiring: it passes the
   * title, subtitle and close actions from its own headless dialog, and the
   * snippets its consumer gave it.
   *
   * When nothing in the header is visible (a hidden title and no close button),
   * the header takes no space and only names the dialog.
   */
  import type { Snippet } from "svelte";
  import type { Action } from "svelte/action";

  const noop: Action<HTMLElement> = () => {};

  interface Props {
    /** Title naming the dialog; always rendered, hidden visually on request. */
    title: string;
    hideTitle?: boolean;
    /** Optional subtitle under the title. */
    subtitle?: string;
    closeButton?: boolean;
    /** Accessible name of the close button. */
    closeLabel: string;
    titleAction: Action<HTMLElement>;
    subtitleAction?: Action<HTMLElement>;
    closeAction?: Action<HTMLElement>;
    /** Leading feedback icon. */
    icon?: Snippet;
    /** Leading ghost button, e.g. back. */
    lead?: Snippet;
    /** Context above the title. */
    meta?: Snippet;
    /** Actions before the close button. */
    actions?: Snippet;
  }

  let {
    title,
    hideTitle = false,
    subtitle,
    closeButton = true,
    closeLabel,
    titleAction,
    subtitleAction = noop,
    closeAction = noop,
    icon,
    lead,
    meta,
    actions,
  }: Props = $props();

  const empty = $derived(
    hideTitle && !closeButton && subtitle === undefined && !icon && !lead && !meta && !actions,
  );
</script>

<header class={["dialog-header", empty && "dialog-header--empty"]}>
  {#if icon}
    <div class="dialog-header__icon">{@render icon()}</div>
  {/if}
  {#if lead}
    <div class="dialog-header__lead">{@render lead()}</div>
  {/if}
  {#if meta}
    <!-- Consumer content above the title, e.g. "Step 1 of 2". It carries no
         progress semantics: the meaning belongs to what the consumer puts here. -->
    <div class="dialog-header__meta">{@render meta()}</div>
  {/if}
  <h2 class={["dialog-header__title", hideTitle && "dialog-header__title--hidden"]} use:titleAction>
    {title}
  </h2>
  {#if subtitle !== undefined}
    <p class="dialog-header__subtitle" use:subtitleAction>{subtitle}</p>
  {/if}
  {#if actions}
    <div class="dialog-header__actions">{@render actions()}</div>
  {/if}
  {#if closeButton}
    <button class="dialog-header__close" type="button" aria-label={closeLabel} use:closeAction>
      <svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" focusable="false">
        <path
          d="M6 6l12 12M18 6L6 18"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
        />
      </svg>
    </button>
  {/if}
</header>

<style>
  /* Rows: meta / title / subtitle; an absent row takes no height. The side
     items span all rows, so they center against the title block. No
     column-gap: an empty optional column must not leave phantom space, so the
     present items carry their own margin. */
  .dialog-header {
    display: grid;
    grid-template-columns: auto auto minmax(0, 1fr) auto auto;
    grid-template-rows: auto auto auto;
    align-items: center;
  }
  .dialog-header--empty {
    display: contents;
  }
  .dialog-header__icon,
  .dialog-header__lead {
    grid-row: 1 / -1;
    display: inline-flex;
    align-items: center;
    margin-inline-end: var(--ds-dialog-header-gap, 0.75rem);
  }
  .dialog-header__icon {
    grid-column: 1;
  }
  .dialog-header__lead {
    grid-column: 2;
  }
  /* Quiet by default so it reads as context; the content can restyle itself. */
  .dialog-header__meta {
    grid-column: 3;
    grid-row: 1;
    margin-block-end: 0.25rem;
    font-size: 0.875rem;
    line-height: var(--ds-line-height-tight, 1.2);
    color: var(--ds-color-text-secondary, #524c44);
  }
  .dialog-header__title {
    grid-column: 3;
    grid-row: 2;
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    line-height: var(--ds-line-height-tight, 1.2);
  }
  /* Kept in the accessibility tree (it names the dialog), removed from view. */
  .dialog-header__title--hidden {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    margin: -1px;
    padding: 0;
    border: 0;
    overflow: hidden;
    clip: rect(0 0 0 0);
    clip-path: inset(50%);
    white-space: nowrap;
  }
  .dialog-header__subtitle {
    grid-column: 3;
    grid-row: 3;
    margin: 0;
    font-size: 0.875rem;
    line-height: var(--ds-line-height-tight, 1.2);
    color: var(--ds-color-text-secondary, #524c44);
  }
  .dialog-header__actions {
    grid-column: 4;
    grid-row: 1 / -1;
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    margin-inline-start: var(--ds-dialog-header-gap, 0.75rem);
  }
  .dialog-header__close {
    grid-column: 5;
    grid-row: 1 / -1;
    margin-inline-start: var(--ds-dialog-header-gap, 0.75rem);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    inline-size: 1.75rem;
    block-size: 1.75rem;
    font-size: 1.25rem;
    padding: 0;
    border: 0;
    border-radius: var(--ds-radius-control, 0.5rem);
    background: transparent;
    color: var(--ds-color-text-secondary, #524c44);
    cursor: pointer;
  }
  .dialog-header__close:hover {
    background: var(--ds-state-hover, rgb(0 0 0 / 0.06));
    color: inherit;
  }
  .dialog-header__close:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring-shadow);
    outline-offset: 2px;
  }
</style>
