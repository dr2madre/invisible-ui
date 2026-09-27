<script lang="ts">
  /**
   * The navigation landmark itself: the logo, the rail toggle, the sections and
   * the footer. The Sidebar owns every piece of state; this file places things.
   */
  import type { Snippet } from "svelte";
  import Icon from "../icon/Icon.svelte";
  import SidebarGroup from "./SidebarGroup.svelte";
  import SidebarItems from "./SidebarItems.svelte";
  import type { ResolvedSection } from "./identity";

  interface Props {
    /** The sections with the name each answers to in `openGroups`. */
    entries: ResolvedSection[];
    label: string;
    value?: string | null;
    collapsed?: boolean;
    mode?: "inline" | "drawer";
    side?: "inline-start" | "inline-end";
    openIds: string[];
    onSelect?: (value: string) => void;
    onNavigate?: () => void;
    onPressGroup?: (id: string) => void;
    /** Given, the rail toggle is rendered; the Sidebar decides whether to. */
    onToggleCollapsed?: () => void;
    collapseLabel?: string;
    expandLabel?: string;
    /** The logo at the top of the navigation. */
    logo?: Snippet;
    /** The footer at the bottom of the navigation. */
    footer?: Snippet;
  }

  let {
    entries,
    label,
    value = null,
    collapsed = false,
    mode = "inline",
    side = "inline-start",
    openIds,
    onSelect,
    onNavigate,
    onPressGroup,
    onToggleCollapsed,
    collapseLabel = "",
    expandLabel = "",
    logo,
    footer,
  }: Props = $props();
</script>

<nav
  class={["sidebar", collapsed && "sidebar--collapsed"]}
  aria-label={label}
  data-mode={mode}
  data-side={side}
  data-collapsed={collapsed ? "" : undefined}
>
  {#if logo}
    <div class="sidebar__logo">{@render logo()}</div>
  {/if}

  {#if onToggleCollapsed}
    <button
      type="button"
      class="sidebar__rail-toggle"
      aria-pressed={collapsed}
      onclick={() => onToggleCollapsed?.()}
    >
      <span class="sidebar__icon" aria-hidden="true">
        <Icon size="1em">
          <polyline points={collapsed ? "9 18 15 12 9 6" : "15 18 9 12 15 6"} />
        </Icon>
      </span>
      <span class="sidebar__label--hidden">{collapsed ? expandLabel : collapseLabel}</span>
    </button>
  {/if}

  <!-- Keyed by the name the section answers to, which the resolver makes
       unique: two sections may share a label, never an identity. -->
  {#each entries as { section, id } (id)}
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
          <p class={["sidebar__section-label", collapsed && "sidebar__label--hidden"]}>
            {section.label}
          </p>
        {/if}
        <SidebarItems items={section.items} {value} {collapsed} {onSelect} {onNavigate} />
      </div>
    {/if}
  {/each}

  {#if footer}
    <div class="sidebar__footer">{@render footer()}</div>
  {/if}
</nav>

<style>
  /* Padding and radius fall back to `--ds-menu-padding` and `--ds-menu-radius`,
     which the ARIA menus share (ADR 0013). */
  .sidebar {
    display: flex;
    flex-direction: column;
    gap: var(--ds-sidebar-gap, 0.75rem);
    inline-size: var(--ds-sidebar-width, 15rem);
    max-inline-size: 100%;
    padding: var(--ds-sidebar-padding, var(--ds-menu-padding, 0.75rem));
    background: var(--ds-sidebar-bg, var(--ds-color-background, #fff));
    border: 1px solid var(--ds-sidebar-border, var(--ds-color-border, #c7c1b7));
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
