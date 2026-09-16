<script lang="ts">
  /**
   * The items of one Sidebar section. An item with an `href` is a link, one
   * without is a button that reports its value. While the rail is collapsed the
   * name leaves the page but stays in the accessibility tree, and a tooltip
   * gives it back to whoever is looking.
   */
  import Tooltip from "../tooltip/Tooltip.svelte";
  import type { SidebarItem } from "./types";

  export let items: SidebarItem[];
  export let value: string | null = null;
  export let collapsed = false;
  /** Called when an item without an `href` is activated. */
  export let onSelect: ((value: string) => void) | undefined = undefined;
  /** Called after any item is activated, link or not. */
  export let onNavigate: (() => void) | undefined = undefined;
</script>

<ul class="sidebar__list" class:sidebar__list--collapsed={collapsed}>
  {#each items as item (item.value)}
    {@const current = item.value === value}
    <li>
      {#if collapsed}
        <Tooltip text={item.label} placement="right">
          {#if item.href}
            <a
              class="sidebar__item"
              class:sidebar__item--active={current}
              href={item.href}
              aria-current={current ? "page" : undefined}
              data-current={current ? "" : undefined}
              on:click={() => onNavigate?.()}
            >
              {#if item.icon}<span class="sidebar__icon"><svelte:component this={item.icon} /></span
                >{/if}
              <span class="sidebar__label--hidden">{item.label}</span>
            </a>
          {:else}
            <button
              type="button"
              class="sidebar__item"
              class:sidebar__item--active={current}
              aria-current={current ? "page" : undefined}
              data-current={current ? "" : undefined}
              on:click={() => {
                onSelect?.(item.value);
                onNavigate?.();
              }}
            >
              {#if item.icon}<span class="sidebar__icon"><svelte:component this={item.icon} /></span
                >{/if}
              <span class="sidebar__label--hidden">{item.label}</span>
            </button>
          {/if}
        </Tooltip>
      {:else if item.href}
        <a
          class="sidebar__item"
          class:sidebar__item--active={current}
          href={item.href}
          aria-current={current ? "page" : undefined}
          data-current={current ? "" : undefined}
          on:click={() => onNavigate?.()}
        >
          {#if item.icon}<span class="sidebar__icon"><svelte:component this={item.icon} /></span
            >{/if}
          <span class="sidebar__label">{item.label}</span>
        </a>
      {:else}
        <button
          type="button"
          class="sidebar__item"
          class:sidebar__item--active={current}
          aria-current={current ? "page" : undefined}
          data-current={current ? "" : undefined}
          on:click={() => {
            onSelect?.(item.value);
            onNavigate?.();
          }}
        >
          {#if item.icon}<span class="sidebar__icon"><svelte:component this={item.icon} /></span
            >{/if}
          <span class="sidebar__label">{item.label}</span>
        </button>
      {/if}
    </li>
  {/each}
</ul>

<style>
  .sidebar__list {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  /* The tooltip wraps its trigger, so the wrapper has to carry the width or
     the item stops filling its row. */
  .sidebar__list li > :global(.tooltip__trigger) {
    inline-size: 100%;
  }
  .sidebar__item {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    inline-size: 100%;
    padding: 0.5rem 0.625rem;
    font: inherit;
    text-align: start;
    color: var(--ds-sidebar-item-text, var(--ds-menu-item-text, var(--ds-color-text, #282420)));
    text-decoration: none;
    background: none;
    border: 0;
    border-radius: var(--ds-sidebar-item-radius, var(--ds-radius-control, 0.5rem));
    cursor: pointer;
  }
  .sidebar__list--collapsed .sidebar__item {
    justify-content: center;
    padding-inline: 0.375rem;
  }
  .sidebar__item:hover {
    background: var(--ds-state-hover, rgb(0 0 0 / 0.06));
  }
  .sidebar__item--active {
    color: var(--ds-color-secondary-body-text, #7a52cc);
    background: color-mix(in srgb, var(--ds-color-secondary, #7a52cc) 10%, transparent);
    font-weight: 600;
  }
  .sidebar__item:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring-shadow, 0 0 0 2px var(--ds-color-focus-ring, #8e6cd4));
  }
  .sidebar__icon {
    display: inline-flex;
    font-size: 1.1em;
  }
  /* Long names wrap rather than being cut: a destination nobody can read is
     not navigation. */
  .sidebar__label {
    overflow-wrap: break-word;
  }
  .sidebar__label--hidden {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
</style>
