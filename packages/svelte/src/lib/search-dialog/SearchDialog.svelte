<script lang="ts">
  /**
   * SearchDialog — search and pick from a list, in a modal (the pattern often
   * marketed as "command palette"): a search combobox inside a modal dialog.
   * The modal shell (portal, focus trap, scroll lock, Escape / backdrop close,
   * focus restore) and the search/filter/keyboard behaviour come from the
   * headless dialog + combobox (`@design-system/core`); this is the styled
   * wrapper. A visually-hidden `role="status"` region announces the filtered
   * result count to screen readers.
   *
   * Pass `items` ({ value, label?, disabled? }); `onSelect(value)` runs when a
   * result is chosen. The `trigger` slot is the opener button's content. No
   * keyboard shortcut is built in: bind `open` and wire the shortcut in the
   * application. Themeable via `--ds-search-dialog-*`.
   */
  import { createSearchDialog, type SearchDialogItem } from "./create-search-dialog";
  import { portal } from "../internal/portal";
  import Icon from "../icon/Icon.svelte";
  import Button from "../button/Button.svelte";
  import Loading from "../loading/Loading.svelte";
  import { getI18n } from "../i18n/create-i18n";

  const { t } = getI18n();

  /** Visual variant for the trigger Button. */
  export let triggerVariant: "default" | "primary" | "secondary" | "ghost" | "danger" = "default";
  export let items: SearchDialogItem[];
  /**
   * Items shown while the query is empty — recents, frequent searches. The
   * application measures and decides; the dialog displays. They may carry
   * their own `group` ("Recent"). Empty means: an empty query shows all items.
   */
  export let suggestions: SearchDialogItem[] = [];
  /**
   * Results are being fetched: shows an indicator, announces "Searching…"
   * through the status region and suppresses the empty state meanwhile.
   * Feed async results through `items` when they arrive.
   */
  export let loading = false;
  export let open = false;
  /** Accessible title for the dialog. Defaults to the i18n catalog's "Search". */
  export let title: string | undefined = undefined;
  /** Accessible label for the search input. Defaults to the i18n catalog's "Search". */
  export let label: string | undefined = undefined;
  /** Input placeholder. Defaults to the i18n catalog's "Type to search…". */
  export let placeholder: string | undefined = undefined;
  /** Text shown when nothing matches. Defaults to the i18n catalog's "No results found.". */
  export let emptyText: string | undefined = undefined;
  export let onSelect: ((value: string) => void) | undefined = undefined;
  export let onOpenChange: ((o: boolean) => void) | undefined = undefined;

  const handleOpenChange = (next: boolean) => {
    open = next;
    onOpenChange?.(next);
  };

  const handleSelect = (value: string) => {
    onSelect?.(value);
  };

  const search = createSearchDialog({
    items,
    suggestions,
    open,
    onSelect: handleSelect,
    onOpenChange: handleOpenChange,
  });
  const {
    open: isOpen,
    triggerAction,
    contentAction,
    titleAction,
    labelAction,
    inputAction,
    listboxAction,
    optionAction,
    items: visible,
    inputValue,
    setItems,
    setSuggestions,
  } = search;

  $: resolvedTitle = title ?? $t("searchDialog.title");
  $: resolvedLabel = label ?? $t("searchDialog.label");
  $: resolvedPlaceholder = placeholder ?? $t("searchDialog.placeholder");
  $: resolvedEmptyText = emptyText ?? $t("searchDialog.empty");

  $: search.setOpen(open);
  $: setItems(items);
  $: setSuggestions(suggestions);

  // The adapter puts items in display order (ungrouped first, then one run
  // per group), so consecutive runs of the same group form the sections.
  type Section = { group: string | null; items: SearchDialogItem[] };
  $: sections = $visible.reduce<Section[]>((acc, item) => {
    const group = item.group ?? null;
    const last = acc[acc.length - 1];
    if (last && last.group === group) last.items.push(item);
    else acc.push({ group, items: [item] });
    return acc;
  }, []);
</script>

<Button variant={triggerVariant} action={triggerAction}>
  <slot name="trigger">Search…</slot>
</Button>

{#if $isOpen}
  <div class="search-dialog__portal" use:portal>
    <div class="search-dialog__overlay" aria-hidden="true"></div>
    <div class="search-dialog__panel" use:contentAction>
      <h2 class="search-dialog__sr-only" use:titleAction>{resolvedTitle}</h2>

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
        {:else if $visible.length === 1}
          {$t("searchDialog.resultOne")}
        {:else}
          {$t("searchDialog.resultMany", { count: $visible.length })}
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
                <div class="search-dialog__item" role="option" use:optionAction={item.value}>
                  {item.label ?? item.value}
                </div>
              {/each}
            </div>
          {:else}
            {#each section.items as item (item.value)}
              <div class="search-dialog__item" role="option" use:optionAction={item.value}>
                {item.label ?? item.value}
              </div>
            {/each}
          {/if}
        {/each}
      </div>
      {#if $visible.length === 0 && !loading}
        <p class="search-dialog__empty">{resolvedEmptyText}</p>
      {/if}
    </div>
  </div>
{/if}

<style>
  .search-dialog__portal {
    position: fixed;
    inset: 0;
    z-index: var(--ds-dialog-z-index, 60);
    display: grid;
    place-items: start center;
    padding: var(--ds-search-dialog-inset, 12vh 1rem 1rem);
  }
  .search-dialog__overlay {
    position: fixed;
    inset: 0;
    background: var(--ds-dialog-overlay, rgb(15 23 42 / 0.5));
  }

  .search-dialog__panel {
    position: relative;
    box-sizing: border-box;
    inline-size: 100%;
    max-inline-size: var(--ds-search-dialog-width, 32rem);
    max-block-size: var(--ds-search-dialog-max-height, 60vh);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: var(--ds-color-background, #fff);
    color: var(--ds-color-text, #0f172a);
    border: 1px solid var(--ds-color-border, #cbd5e1);
    border-radius: var(--ds-search-dialog-radius, var(--ds-radius-surface, 0.75rem));
    box-shadow: var(
      --ds-elevation-overlay,
      0 10px 15px -3px rgb(0 0 0 / 0.1),
      0 4px 6px -4px rgb(0 0 0 / 0.1)
    );
  }

  .search-dialog__search {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-block-end: 1px solid var(--ds-color-border, #cbd5e1);
  }
  .search-dialog__search-icon {
    display: inline-flex;
    inline-size: 1.1em;
    block-size: 1.1em;
    flex: none;
    color: var(--ds-color-text-secondary, #64748b);
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
    border-block-end: 1px solid var(--ds-color-border, #cbd5e1);
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
    color: var(--ds-color-text-secondary, #64748b);
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
  .search-dialog__item:global([data-active]) {
    background: var(--ds-state-hover, rgb(0 0 0 / 0.06));
  }
  .search-dialog__item:global([data-disabled]) {
    color: var(--ds-color-text-disabled, #94a3b8);
    cursor: not-allowed;
  }
  .search-dialog__empty {
    margin: 0;
    padding: 1.5rem 0.625rem;
    text-align: center;
    color: var(--ds-color-text-secondary, #64748b);
    cursor: default;
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
</style>
