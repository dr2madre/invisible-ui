<script lang="ts">
  /**
   * The items of one Sidebar section. An item with an `href` is a link, one
   * without is a button that reports its value. While the rail is collapsed the
   * name leaves the page but stays in the accessibility tree, and a tooltip
   * gives it back to whoever is looking.
   *
   * A badge shows its count or a dot after the label, or on the icon in the
   * rail, and its text is part of the name. An unavailable item stays
   * focusable, shows a lock and its reason under the label (in the rail's
   * tooltip once the labels are hidden), reads the reason as its description,
   * and does nothing when activated. The state and the activation come from
   * the headless navigation bar, shared with the Navigation Bar.
   */
  import { navigationBar } from "@invisible-ui/core";
  import Icon from "../icon/Icon.svelte";
  import Tooltip from "../tooltip/Tooltip.svelte";
  import { getI18n } from "../i18n/create-i18n";
  import { stableId } from "../internal/stable-id";
  import { toSvelte } from "../internal/svelte-props";
  import type { SidebarItem } from "./types";

  interface Props {
    items: SidebarItem[];
    value?: string | null;
    collapsed?: boolean;
    /** Called when an item without an `href` is activated. */
    onSelect?: (value: string) => void;
    /** Called after any item is activated, link or not. */
    onNavigate?: () => void;
  }

  let { items, value = null, collapsed = false, onSelect, onNavigate }: Props = $props();

  const { t } = getI18n();
  const id = stableId("ds-sidebar-items");
  const reasonId = (index: number) => `${id}-reason-${index}`;
</script>

{#snippet control(item: SidebarItem, index: number)}
  {@const current = item.value === value}
  <svelte:element
    this={item.href === undefined ? "button" : "a"}
    class={["sidebar__item", current && "sidebar__item--active"]}
    {...toSvelte(
      navigationBar.destinationProps({
        destination: item,
        current,
        reasonId: reasonId(index),
        // Read at activation time, so a replaced callback is the one called.
        onSelect: (selected) => onSelect?.(selected),
        onNavigate: () => onNavigate?.(),
      }),
    )}
  >
    {#if item.icon}<span class="sidebar__icon"><item.icon /></span>{/if}
    <span class={collapsed ? "sidebar__label--hidden" : "sidebar__label"}
      >{item.label}{#if item.badge}<span class="sidebar__label--hidden">, {item.badge.label}</span
        >{/if}{#if item.unavailable}<span
          class="sidebar__reason"
          id={reasonId(index)}
          aria-hidden="true">{item.unavailable.reason}</span
        >{/if}</span
    >
    {#if item.unavailable}
      <span class="sidebar__status" aria-hidden="true">
        <Icon size="1em">
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </Icon>
      </span>
    {/if}
    {#if item.badge}
      <span
        class={["sidebar__badge", item.badge.content === undefined && "sidebar__badge--dot"]}
        aria-hidden="true">{item.badge.content ?? ""}</span
      >
    {/if}
  </svelte:element>
{/snippet}

<ul class={["sidebar__list", collapsed && "sidebar__list--collapsed"]}>
  {#each items as item, index (item.value)}
    <li>
      {#if collapsed}
        <Tooltip
          text={item.unavailable
            ? $t("sidebar.unavailableTooltip", {
                label: item.label,
                reason: item.unavailable.reason,
              })
            : item.label}
          placement="right"
        >
          {@render control(item, index)}
        </Tooltip>
      {:else}
        {@render control(item, index)}
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
    position: relative;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.625rem;
    inline-size: 100%;
    padding: 0.5rem 0.625rem;
    font: inherit;
    text-align: start;
    color: var(--ds-sidebar-item-text, var(--ds-color-text, #272727));
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
  /* The rail shows no label, so its weight cannot mark the current item: a
     bar at the inline start does, never colour alone. A border, so it stays
     under forced colors. */
  .sidebar__list--collapsed .sidebar__item--active::before {
    content: "";
    position: absolute;
    inset-block: 0.5rem;
    inset-inline-start: 0;
    border-inline-start: 3px solid currentColor;
  }
  .sidebar__item:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring-shadow, 0 0 0 2px var(--ds-color-focus-ring, #8e6cd4));
  }
  .sidebar__item[data-unavailable] {
    color: var(--ds-color-text-disabled, #757575);
    cursor: default;
  }
  .sidebar__icon {
    display: inline-flex;
    font-size: 1.1em;
  }
  /* Long names wrap rather than being cut: a destination nobody can read is
     not navigation. When the row is too narrow, the label takes a line of its
     own before it is squeezed beside the badge. */
  .sidebar__label {
    flex: 1 1 4rem;
    min-inline-size: 0;
    overflow-wrap: break-word;
  }
  .sidebar__reason {
    display: block;
    font-size: 0.8125rem;
    font-weight: 400;
    color: var(--ds-color-text-secondary, #515151);
  }
  .sidebar__status {
    display: inline-flex;
    font-size: 0.875rem;
  }
  /* The count grows with the text; the dot keeps its size. */
  .sidebar__badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    min-inline-size: 16px;
    min-block-size: 16px;
    padding-inline: 4px;
    font-size: 0.6875rem;
    font-weight: 600;
    line-height: 1;
    color: var(--ds-sidebar-badge-text, var(--ds-color-on-status, #fff));
    white-space: nowrap;
    background: var(--ds-sidebar-badge-surface, var(--ds-color-danger, #be3b50));
    border-radius: var(--ds-radius-pill, 999px);
  }
  .sidebar__badge--dot {
    min-inline-size: 0;
    min-block-size: 0;
    inline-size: 8px;
    block-size: 8px;
    padding: 0;
  }
  /* In the rail the badge and the lock sit at the icon's corners. */
  .sidebar__list--collapsed .sidebar__badge,
  .sidebar__list--collapsed .sidebar__status {
    position: absolute;
    inset-inline-start: calc(50% + 0.25rem);
  }
  .sidebar__list--collapsed .sidebar__badge {
    inset-block-start: 0.25rem;
  }
  .sidebar__list--collapsed .sidebar__badge--dot {
    inset-block-start: 0.375rem;
  }
  .sidebar__list--collapsed .sidebar__status {
    inset-block-end: 0.25rem;
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
  /* Forced colors drop backgrounds: the badge keeps a border, so a dot stays
     visible. */
  @media (forced-colors: active) {
    .sidebar__badge {
      border: 1px solid CanvasText;
    }
  }
</style>
