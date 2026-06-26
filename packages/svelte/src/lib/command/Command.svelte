<script lang="ts">
  /**
   * Command — a command palette (⌘K-style): a search combobox inside a modal
   * dialog. The modal shell (portal, focus trap, scroll lock, Escape / backdrop
   * close, focus restore) and the search/filter/keyboard behaviour come from the
   * headless command (`@design-system/core` dialog + combobox); this is the
   * styled wrapper.
   *
   * Pass `items` ({ value, label?, disabled? }); `onCommand(value)` runs when a
   * command is chosen. The `trigger` slot is the opener button's content. Bind
   * `open` to wire a keyboard shortcut. Themeable via `--ds-command-*`.
   */
  import { createCommand, type CommandItem } from "./create-command";
  import { portal } from "../internal/portal";
  import Icon from "../icon/Icon.svelte";
  import Button from "../button/Button.svelte";

  /** Visual variant for the trigger Button. */
  export let triggerVariant: "default" | "primary" | "secondary" | "ghost" | "danger" = "default";
  export let items: CommandItem[];
  export let open = false;
  /** Accessible title for the dialog. */
  export let title = "Command menu";
  /** Accessible label for the search input. */
  export let label = "Search commands";
  export let placeholder = "Type a command or search…";
  export let emptyText = "No results found.";
  export let onCommand: ((value: string) => void) | undefined = undefined;
  export let onOpenChange: ((o: boolean) => void) | undefined = undefined;

  const command = createCommand({ items, open, onCommand, onOpenChange });
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
  } = command;
</script>

<Button variant={triggerVariant} action={triggerAction}>
  <slot name="trigger">Search…</slot>
</Button>

{#if $isOpen}
  <div class="command__portal" use:portal>
    <div class="command__overlay" aria-hidden="true"></div>
    <div class="command__panel" use:contentAction>
      <h2 class="command__sr-only" use:titleAction>{title}</h2>

      <div class="command__search">
        <span class="command__search-icon" aria-hidden="true">
          <Icon size="100%"
            ><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></Icon
          >
        </span>
        <label class="command__sr-only" use:labelAction>{label}</label>
        <input
          class="command__input"
          type="text"
          {placeholder}
          value={$inputValue}
          use:inputAction
        />
      </div>

      <ul class="command__list" use:listboxAction>
        {#each $visible as item (item.value)}
          <li class="command__item" use:optionAction={item.value}>{item.label ?? item.value}</li>
        {:else}
          <li class="command__empty" role="option" aria-disabled="true">{emptyText}</li>
        {/each}
      </ul>
    </div>
  </div>
{/if}

<style>
  .command__portal {
    position: fixed;
    inset: 0;
    z-index: var(--ds-dialog-z-index, 60);
    display: grid;
    place-items: start center;
    padding: var(--ds-command-inset, 12vh 1rem 1rem);
  }
  .command__overlay {
    position: fixed;
    inset: 0;
    background: var(--ds-dialog-overlay, rgb(15 23 42 / 0.5));
  }

  .command__panel {
    position: relative;
    box-sizing: border-box;
    inline-size: 100%;
    max-inline-size: var(--ds-command-width, 32rem);
    max-block-size: var(--ds-command-max-height, 60vh);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: var(--ds-color-background, #fff);
    color: var(--ds-color-text, #0f172a);
    border: 1px solid var(--ds-color-border, #cbd5e1);
    border-radius: var(--ds-command-radius, var(--ds-radius-surface, 0.75rem));
    box-shadow: var(
      --ds-elevation-overlay,
      0 10px 15px -3px rgb(0 0 0 / 0.1),
      0 4px 6px -4px rgb(0 0 0 / 0.1)
    );
  }

  .command__search {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-block-end: 1px solid var(--ds-color-border, #cbd5e1);
  }
  .command__search-icon {
    display: inline-flex;
    inline-size: 1.1em;
    block-size: 1.1em;
    flex: none;
    color: var(--ds-color-text-secondary, #64748b);
  }
  .command__input {
    flex: 1;
    min-inline-size: 0;
    border: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    font-size: 1rem;
  }
  .command__input:focus {
    outline: none;
  }

  .command__list {
    margin: 0;
    padding: var(--ds-command-list-padding, 0.375rem);
    list-style: none;
    overflow-y: auto;
  }
  .command__item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.625rem;
    border-radius: var(--ds-radius-control, 0.5rem);
    cursor: pointer;
    user-select: none;
  }
  .command__item:global([data-active]) {
    background: var(--ds-state-hover, rgb(0 0 0 / 0.06));
  }
  .command__item:global([data-disabled]) {
    color: var(--ds-color-text-disabled, #94a3b8);
    cursor: not-allowed;
  }
  .command__empty {
    padding: 1.5rem 0.625rem;
    text-align: center;
    color: var(--ds-color-text-secondary, #64748b);
    cursor: default;
  }

  .command__sr-only {
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
