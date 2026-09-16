<script lang="ts">
  import Sidebar from "./Sidebar.svelte";
  import type { SidebarSection } from "./types";

  export let value: string | null = "home";
  export let mode: "inline" | "drawer" = "inline";
  export let collapsed = false;
  export let open = false;
  export let openGroups: string[] | undefined = undefined;
  export let onSelect: ((value: string) => void) | undefined = undefined;
  export let onCollapsedChange: ((collapsed: boolean) => void) | undefined = undefined;
  export let onOpenChange: ((open: boolean) => void) | undefined = undefined;
  export let onOpenGroupsChange: ((groups: string[]) => void) | undefined = undefined;
  export let closeOnNavigate = true;
  export let renderTrigger = true;
  export let returnFocusTo: string | undefined = undefined;
  export let withSlots = false;
  export let duplicateLabels = false;

  const duplicates: SidebarSection[] = [
    { label: "Tools", items: [{ value: "a", label: "A" }] },
    { label: "Tools", items: [{ value: "b", label: "B" }] },
  ];

  const sections: SidebarSection[] = [
    {
      label: "Main",
      items: [
        { value: "home", label: "Home" },
        { value: "search", label: "Search" },
      ],
    },
    {
      id: "reports",
      label: "Reports",
      collapsible: true,
      items: [
        { value: "daily", label: "Daily", href: "/daily" },
        { value: "weekly", label: "Weekly", href: "/weekly" },
      ],
    },
  ];
</script>

{#if withSlots}
  <Sidebar {sections} {value} {mode} {collapsed} {open} {onSelect}>
    <span slot="logo">Brand</span>
    <span slot="footer">Signed in</span>
  </Sidebar>
{:else}
  <Sidebar
    sections={duplicateLabels ? duplicates : sections}
    {value}
    {mode}
    {collapsed}
    {open}
    {openGroups}
    {onSelect}
    {onCollapsedChange}
    {onOpenChange}
    {onOpenGroupsChange}
    {closeOnNavigate}
    {renderTrigger}
    {returnFocusTo}
  />
{/if}
