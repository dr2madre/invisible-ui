<script lang="ts">
  import Sidebar from "./Sidebar.svelte";
  import Dot from "./sidebar-icon.fixture.svelte";
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
  /** Drops the icons, which is what takes the rail away. */
  export let withoutIcons = false;
  export let duplicateIds = false;
  export let missingId = false;
  /** Moves the current destination inside the collapsible section. */
  export let movedIntoGroup = false;
  /** Exactly the shape the former name accepted: no ids, no icons, no groups. */
  export let legacyShape = false;

  // Two collapsible sections under one label, told apart by their ids.
  const duplicates: SidebarSection[] = [
    { id: "tools-a", label: "Tools", collapsible: true, items: [{ value: "a", label: "A" }] },
    { id: "tools-b", label: "Tools", collapsible: true, items: [{ value: "b", label: "B" }] },
  ];
  const sameIds: SidebarSection[] = [
    { id: "tools", label: "Tools", collapsible: true, items: [{ value: "a", label: "A" }] },
    { id: "tools", label: "Tools", collapsible: true, items: [{ value: "b", label: "B" }] },
  ];
  const noId = [
    { label: "Tools", collapsible: true, items: [{ value: "a", label: "A" }] },
  ] as unknown as SidebarSection[];

  const withIcons: SidebarSection[] = [
    {
      label: "Main",
      items: [
        { value: "home", label: "Home", icon: Dot },
        { value: "search", label: "Search", icon: Dot },
      ],
    },
    {
      id: "reports",
      label: "Reports",
      collapsible: true,
      items: [
        { value: "daily", label: "Daily", href: "/daily", icon: Dot },
        { value: "weekly", label: "Weekly", href: "/weekly", icon: Dot },
      ],
    },
  ];
  const withoutTheIcons: SidebarSection[] = withIcons.map((section) => ({
    ...section,
    items: section.items.map(({ icon: _icon, ...item }) => item),
  })) as SidebarSection[];

  const moved: SidebarSection[] = [
    { label: "Main", items: [{ value: "search", label: "Search", icon: Dot }] },
    {
      id: "reports",
      label: "Reports",
      collapsible: true,
      items: [
        { value: "home", label: "Home", icon: Dot },
        { value: "daily", label: "Daily", href: "/daily", icon: Dot },
      ],
    },
  ];

  const legacy: SidebarSection[] = [
    { label: "Main", items: [{ value: "inbox", label: "Inbox" }] },
    { items: [{ value: "settings", label: "Settings", href: "/settings" }] },
  ];

  $: sections = legacyShape
    ? legacy
    : movedIntoGroup
      ? moved
      : withoutIcons
        ? withoutTheIcons
        : withIcons;
  $: chosen = duplicateIds ? sameIds : missingId ? noId : duplicateLabels ? duplicates : sections;
</script>

{#if withSlots}
  <Sidebar sections={chosen} {value} {mode} {collapsed} {open} {onSelect}>
    <span slot="logo">Brand</span>
    <span slot="footer">Signed in</span>
  </Sidebar>
{:else}
  <Sidebar
    sections={chosen}
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
