<script lang="ts">
  /**
   * The navigation landmark itself: the logo, the rail toggle, the sections and
   * the footer. The Sidebar owns every piece of state; this file places things.
   */
  import Icon from "../icon/Icon.svelte";
  import SidebarGroup from "./SidebarGroup.svelte";
  import SidebarItems from "./SidebarItems.svelte";
  import type { SidebarSection } from "./types";

  export let sections: SidebarSection[];
  export let label: string;
  export let value: string | null = null;
  export let collapsed = false;
  export let mode: "inline" | "drawer" = "inline";
  export let side: "inline-start" | "inline-end" = "inline-start";
  export let openIds: string[];
  export let sectionId: (section: SidebarSection, index: number) => string;
  export let onSelect: ((value: string) => void) | undefined = undefined;
  export let onNavigate: (() => void) | undefined = undefined;
  export let onPressGroup: ((id: string) => void) | undefined = undefined;
  /** Given, the rail toggle is rendered; the Sidebar decides whether to. */
  export let onToggleCollapsed: (() => void) | undefined = undefined;
  export let collapseLabel = "";
  export let expandLabel = "";
</script>

<nav
  class="sidebar"
  class:sidebar--collapsed={collapsed}
  aria-label={label}
  data-mode={mode}
  data-side={side}
  data-collapsed={collapsed ? "" : undefined}
>
  {#if $$slots.logo}
    <div class="sidebar__logo"><slot name="logo" /></div>
  {/if}

  {#if onToggleCollapsed}
    <button
      type="button"
      class="sidebar__rail-toggle"
      aria-pressed={collapsed}
      on:click={() => onToggleCollapsed?.()}
    >
      <span class="sidebar__icon" aria-hidden="true">
        <Icon size="1em">
          <polyline points={collapsed ? "9 18 15 12 9 6" : "15 18 9 12 15 6"} />
        </Icon>
      </span>
      <span class="sidebar__label--hidden">{collapsed ? expandLabel : collapseLabel}</span>
    </button>
  {/if}

  {#each sections as section, s (sectionId(section, s))}
    {@const id = sectionId(section, s)}
    {#if section.collapsible && section.label}
      <SidebarGroup
        label={section.label}
        open={openIds.includes(id)}
        {collapsed}
        onToggle={() => onPressGroup?.(id)}
      >
        <SidebarItems items={section.items} {value} {collapsed} {onSelect} {onNavigate} />
      </SidebarGroup>
    {:else}
      <div class="sidebar__section">
        {#if section.label}
          <p class="sidebar__section-label" class:sidebar__label--hidden={collapsed}>
            {section.label}
          </p>
        {/if}
        <SidebarItems items={section.items} {value} {collapsed} {onSelect} {onNavigate} />
      </div>
    {/if}
  {/each}

  {#if $$slots.footer}
    <div class="sidebar__footer"><slot name="footer" /></div>
  {/if}
</nav>

<style>
  /* Every legacy `--ds-menu-*` name is still read as a fallback: a consumer
     who themed this component under its former spelling keeps its theme until
     the deprecation completes (ADR 0013). */
  .sidebar {
    display: flex;
    flex-direction: column;
    gap: var(--ds-sidebar-gap, var(--ds-menu-gap, 0.75rem));
    inline-size: var(--ds-sidebar-width, var(--ds-menu-width, 15rem));
    max-inline-size: 100%;
    padding: var(--ds-sidebar-padding, var(--ds-menu-padding, 0.75rem));
    background: var(--ds-sidebar-bg, var(--ds-menu-bg, var(--ds-color-background, #fff)));
    border: 1px solid
      var(--ds-sidebar-border, var(--ds-menu-border, var(--ds-color-border, #c7c1b7)));
    border-radius: var(
      --ds-sidebar-radius,
      var(--ds-menu-radius, var(--ds-radius-surface, 0.75rem))
    );
  }
  .sidebar--collapsed {
    inline-size: var(--ds-sidebar-rail-width, 3.5rem);
    align-items: stretch;
  }
  .sidebar__logo {
    padding: 0.25rem 0.5rem;
  }
  .sidebar__rail-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.375rem;
    color: var(--ds-color-text-secondary, #524c44);
    background: none;
    border: 0;
    border-radius: var(--ds-radius-control, 0.5rem);
    cursor: pointer;
  }
  .sidebar__rail-toggle:hover {
    background: var(--ds-state-hover, rgb(0 0 0 / 0.06));
  }
  .sidebar__rail-toggle:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring-shadow, 0 0 0 2px var(--ds-color-focus-ring, #8e6cd4));
  }
  .sidebar__section-label {
    margin: 0 0 0.25rem;
    padding-inline: 0.5rem;
    font-size: 0.6875rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--ds-color-text-secondary, #524c44);
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
  .sidebar__footer {
    margin-block-start: auto;
    padding-block-start: 0.5rem;
    border-block-start: 1px solid var(--ds-color-border, #c7c1b7);
  }
</style>
