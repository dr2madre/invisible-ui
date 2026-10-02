<script lang="ts">
  /**
   * SearchDialog — search and pick from a list, in a modal (the pattern often
   * marketed as "command palette"): a search combobox inside a modal dialog.
   * The modal shell (native `<dialog>` + `showModal()`, scroll lock, Escape /
   * backdrop close, focus restore) and the search/filter/keyboard behaviour come from the
   * headless dialog + combobox (`@design-system/core`); this is the styled
   * wrapper. A visually-hidden `role="status"` region announces the filtered
   * result count to screen readers.
   *
   * Pass `items` ({ value, label?, disabled? }); `onSelect(value)` runs when a
   * result is chosen. The `trigger` snippet is the opener button's content. No
   * keyboard shortcut is built in: bind `open` and wire the shortcut in the
   * application. The header is the one the dialog family shares; by default
   * it only names the dialog, and `hideTitle={false}` / `closeButton` show the
   * title and a close button above the search field. Themeable via
   * `--ds-search-dialog-*`.
   *
   * The status area after the results holds messages about the dialog's own
   * task (ADR 0016): `notify(options)`, `dismissNotice(id)` and
   * `clearNotices()` on the instance, with the same contract as `Dialog`.
   */
  import { untrack, type Snippet } from "svelte";
  import { createSearchDialog, type SearchDialogItem } from "./create-search-dialog";
  import Icon from "../icon/Icon.svelte";
  import Button from "../button/Button.svelte";
  import DialogHeader from "../dialog/DialogHeader.svelte";
  import DialogStatus from "../dialog/DialogStatus.svelte";
  import type { DialogNoticeOptions } from "../dialog/create-dialog";
  import Loading from "../loading/Loading.svelte";
  import Kbd from "../kbd/Kbd.svelte";
  import { getI18n } from "../i18n/create-i18n";
  import { controllable } from "../internal/controllable.svelte";

  const { t } = getI18n();

  interface Props {
    /** Visual variant for the trigger Button. */
    triggerVariant?: "default" | "primary" | "secondary" | "ghost" | "danger";
    items: SearchDialogItem[];
    /**
     * Items shown while the query is empty — recents, frequent searches. The
     * application measures and decides; the dialog displays. They may carry
     * their own `group` ("Recent"). Empty means: an empty query shows all items.
     */
    suggestions?: SearchDialogItem[];
    /**
     * Results are being fetched: shows an indicator, announces "Searching…"
     * through the status region and suppresses the empty state meanwhile.
     * Feed async results through `items` when they arrive.
     */
    loading?: boolean;
    open?: boolean;
    /** Accessible title for the dialog. Defaults to the i18n catalog's "Search". */
    title?: string;
    /**
     * Visually hide the title (the default: the search field reads as the
     * header). It still names the dialog for screen readers.
     */
    hideTitle?: boolean;
    /** Show a close button in the header; it closes like Escape. */
    closeButton?: boolean;
    /** Accessible label for the close button. Defaults to the i18n catalog's "Close". */
    closeLabel?: string;
    /** Accessible label for the search input. Defaults to the i18n catalog's "Search". */
    label?: string;
    /** Input placeholder. Defaults to the i18n catalog's "Type to search…". */
    placeholder?: string;
    /** Text shown when nothing matches. Defaults to the i18n catalog's "No results found.". */
    emptyText?: string;
    onSelect?: (value: string) => void;
    onOpenChange?: (o: boolean) => void;
    /** The trigger button's content. Defaults to the i18n catalog's label. */
    trigger?: Snippet;
  }

  let {
    triggerVariant = "default",
    items,
    suggestions = [],
    loading = false,
    open = $bindable(false),
    title,
    hideTitle = true,
    closeButton = false,
    closeLabel,
    label,
    placeholder,
    emptyText,
    onSelect,
    onOpenChange,
    trigger,
  }: Props = $props();

  const handleSelect = (value: string) => {
    onSelect?.(value);
  };

  // Seeded once from the first props; the effects below follow later ones.
  const search = untrack(() =>
    createSearchDialog({
      items,
      suggestions,
      open,
      onSelect: handleSelect,
      // The prop first, then the report (ADR 0011).
      onOpenChange: (next) => {
        mirror.write(next);
        onOpenChange?.(next);
      },
    }),
  );
  const {
    open: isOpen,
    triggerAction,
    contentAction,
    titleAction,
    closeAction,
    labelAction,
    inputAction,
    listboxAction,
    optionAction,
    items: visible,
    inputValue,
    setItems,
    setSuggestions,
  } = search;

  const resolvedTitle = $derived(title ?? $t("searchDialog.title"));
  const resolvedCloseLabel = $derived(closeLabel ?? $t("dialog.close"));
  const resolvedLabel = $derived(label ?? $t("searchDialog.label"));
  const resolvedPlaceholder = $derived(placeholder ?? $t("searchDialog.placeholder"));
  const resolvedEmptyText = $derived(emptyText ?? $t("searchDialog.empty"));

  // Controllable mirror through the no-notify sync: opening from the outside
  // is not the user asking for it, so it reports nothing (ADR 0011).
  const mirror = controllable({
    get: () => open,
    set: (next) => (open = next),
    reflect: search.syncOpen,
  });
  $effect.pre(() => {
    setItems(items);
  });
  $effect.pre(() => {
    setSuggestions(suggestions);
  });

  // The adapter puts items in display order (ungrouped first, then one run
  // per group), so consecutive runs of the same group form the sections.
  type Section = { group: string | null; items: SearchDialogItem[] };
  const sections = $derived(
    $visible.reduce<Section[]>((acc, item) => {
      const group = item.group ?? null;
      const last = acc[acc.length - 1];
      if (last && last.group === group) last.items.push(item);
      else acc.push({ group, items: [item] });
      return acc;
    }, []),
  );

  /** Show a notice in the status area and return its id (ADR 0016). */
  export function notify(options: DialogNoticeOptions): string {
    return search.notify(options);
  }

  /** Remove one notice from the status area. */
  export function dismissNotice(id: string): void {
    search.dismissNotice(id);
  }

  /** Remove every notice from the status area. */
  export function clearNotices(): void {
    search.clearNotices();
  }
</script>

<Button variant={triggerVariant} action={triggerAction}>
  {#if trigger}{@render trigger()}{:else}{$t("searchDialog.trigger")}{/if}
</Button>

{#if $isOpen}
  <dialog class="search-dialog__panel" use:contentAction>
    <DialogHeader
      title={resolvedTitle}
      {hideTitle}
      {closeButton}
      closeLabel={resolvedCloseLabel}
      {titleAction}
      {closeAction}
    />

    <div class="search-dialog__search">
      <span class="search-dialog__search-icon" aria-hidden="true">
        <Icon size="100%"
          ><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></Icon
        >
      </span>
      <!-- svelte-ignore a11y_label_has_associated_control -->
      <label class="search-dialog__sr-only" use:labelAction>{resolvedLabel}</label>
      <input
        class="search-dialog__input"
        type="text"
        placeholder={resolvedPlaceholder}
        value={$inputValue}
        use:inputAction
      />
    </div>

    <!-- Polite announcement of the filtered results for screen readers. -->
    <div class="search-dialog__sr-only" role="status">
      {#if loading}
        {$t("searchDialog.loading")}
      {:else if $visible.length === 0}
        {resolvedEmptyText}
      {:else}
        {$t("searchDialog.results", { count: $visible.length })}
      {/if}
    </div>

    {#if loading}
      <div class="search-dialog__loading">
        <Loading variant="dots" decorative />
      </div>
    {/if}

    <!-- The listbox stays in the DOM even when empty so the input's
           aria-controls keeps pointing at a real element. -->
    <!-- Divs with explicit roles: ARIA in HTML does not allow role="group"
           on <li>, and the listbox/option roles carry the list semantics. -->
    <div class="search-dialog__list" use:listboxAction>
      {#each sections as section, s (section.group ?? `flat-${s}`)}
        {#if section.group}
          <!-- The visible header is hidden from AT; the group's aria-label
                 carries the same name, so it is announced once. -->
          <div class="search-dialog__group" role="group" aria-label={section.group}>
            <span class="search-dialog__group-header" aria-hidden="true">{section.group}</span>
            {#each section.items as item (item.value)}
              <!-- svelte-ignore a11y_role_has_required_aria_props -->
              <div class="search-dialog__item" role="option" use:optionAction={item.value}>
                <span class="search-dialog__item-label">{item.label ?? item.value}</span>
                {#if item.shortcut}
                  <span class="search-dialog__item-shortcut">
                    {#if Array.isArray(item.shortcut)}
                      <Kbd keys={item.shortcut} />
                    {:else}
                      <Kbd>{item.shortcut}</Kbd>
                    {/if}
                  </span>
                {/if}
              </div>
            {/each}
          </div>
        {:else}
          {#each section.items as item (item.value)}
            <!-- svelte-ignore a11y_role_has_required_aria_props -->
            <div class="search-dialog__item" role="option" use:optionAction={item.value}>
              <span class="search-dialog__item-label">{item.label ?? item.value}</span>
              {#if item.shortcut}
                <span class="search-dialog__item-shortcut">
                  {#if Array.isArray(item.shortcut)}
                    <Kbd keys={item.shortcut} />
                  {:else}
                    <Kbd>{item.shortcut}</Kbd>
                  {/if}
                </span>
              {/if}
            </div>
          {/each}
        {/if}
      {/each}
    </div>
    {#if $visible.length === 0 && !loading}
      <p class="search-dialog__empty">{resolvedEmptyText}</p>
    {/if}
    <!-- No footer: the status area closes the panel, after the results. -->
    <DialogStatus dialog={search} />
  </dialog>
{/if}

<style>
  .search-dialog__panel::backdrop {
    background: var(--ds-dialog-overlay, rgb(28 25 21 / 0.5));
  }
  .search-dialog__panel {
    margin-block-start: var(--ds-search-dialog-inset-top, 12vh);
    margin-inline: auto;
    box-sizing: border-box;
    inline-size: 100%;
    max-inline-size: var(--ds-search-dialog-width, 32rem);
    max-block-size: var(--ds-search-dialog-max-height, 60vh);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: var(--ds-color-background, #fff);
    color: var(--ds-color-text, #282420);
    border: 1px solid var(--ds-color-border, #c7c1b7);
    border-radius: var(--ds-search-dialog-radius, var(--ds-radius-surface, 0.75rem));
    box-shadow: var(
      --ds-elevation-overlay,
      0 10px 15px -3px rgb(0 0 0 / 0.1),
      0 4px 6px -4px rgb(0 0 0 / 0.1)
    );
  }

  /* The panel is flush, so a visible header brings its own inset. */
  .search-dialog__panel > :global(.dialog-header) {
    padding: 0.75rem 1rem;
    border-block-end: 1px solid var(--ds-color-border, #c7c1b7);
  }
  .search-dialog__search {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-block-end: 1px solid var(--ds-color-border, #c7c1b7);
  }
  /* The input drops its own outline, so its row shows the focus ring, inside
     the panel's edge (WCAG 2.4.7). */
  .search-dialog__search:focus-within {
    box-shadow: inset 0 0 0 var(--ds-focus-ring-width, 2px) var(--ds-color-focus-ring, #8e6cd4);
  }
  .search-dialog__search-icon {
    display: inline-flex;
    inline-size: 1.1em;
    block-size: 1.1em;
    flex: none;
    color: var(--ds-color-text-secondary, #524c44);
  }
  .search-dialog__input {
    flex: 1;
    min-inline-size: 0;
    border: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    font-size: 1rem;
  }
  .search-dialog__input:focus {
    outline: none;
  }

  .search-dialog__loading {
    display: flex;
    justify-content: center;
    padding: 0.75rem;
    border-block-end: 1px solid var(--ds-color-border, #c7c1b7);
  }
  .search-dialog__list {
    margin: 0;
    padding: var(--ds-search-dialog-list-padding, 0.375rem);
    overflow-y: auto;
  }
  .search-dialog__group-header {
    display: block;
    padding: 0.5rem 0.625rem 0.25rem;
    font-size: 0.6875rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--ds-color-text-secondary, #524c44);
  }
  .search-dialog__item-label {
    min-inline-size: 0;
  }
  .search-dialog__item-shortcut {
    margin-inline-start: auto;
    flex: none;
  }
  .search-dialog__item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.625rem;
    border-radius: var(--ds-radius-control, 0.5rem);
    cursor: pointer;
    user-select: none;
  }
  /* Focus stays in the input, so a ring marks the active result (WCAG 2.4.7,
     1.4.11); the tint alone is too faint. */
  .search-dialog__item:global([data-active]) {
    background: var(--ds-state-hover, rgb(0 0 0 / 0.06));
    box-shadow: inset 0 0 0 var(--ds-focus-ring-width, 2px) var(--ds-color-focus-ring, #8e6cd4);
  }
  .search-dialog__item:global([data-disabled]) {
    color: var(--ds-color-text-disabled, #757067);
    cursor: not-allowed;
  }
  .search-dialog__empty {
    margin: 0;
    padding: 1.5rem 0.625rem;
    text-align: center;
    color: var(--ds-color-text-secondary, #524c44);
    cursor: default;
  }

  /* The panel is flush, so the status area brings its own inset. */
  .search-dialog__panel > :global(.dialog-status) {
    margin: 0;
    padding: 0.75rem 1rem;
    border-block-start: 1px solid var(--ds-color-border, #c7c1b7);
  }
  .search-dialog__sr-only {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
    border: 0;
  }
  /* Forced colors: the active item is marked by a tint alone, and tints flatten away.
     Keyboard focus stays in the input, so the list must show which
     option it is on. The list scrolls, so the ring goes inside. */
  @media (forced-colors: active) {
    .search-dialog__item:global([data-active]) {
      outline: var(--ds-focus-ring-width, 2px) solid Highlight;
      outline-offset: -2px;
    }
  }
</style>
