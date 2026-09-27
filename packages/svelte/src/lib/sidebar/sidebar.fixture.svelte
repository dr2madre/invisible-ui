<script lang="ts">
  import Sidebar from "./Sidebar.svelte";
  import Dot from "./sidebar-icon.fixture.svelte";
  import type { SidebarSection } from "./types";

  interface Props {
    value?: string | null;
    mode?: "inline" | "drawer";
    collapsed?: boolean;
    open?: boolean;
    openGroups?: string[];
    onSelect?: (value: string) => void;
    onCollapsedChange?: (collapsed: boolean) => void;
    onOpenChange?: (open: boolean) => void;
    onOpenGroupsChange?: (groups: string[]) => void;
    closeOnNavigate?: boolean;
    renderTrigger?: boolean;
    returnFocusTo?: string;
    withSlots?: boolean;
    duplicateLabels?: boolean;
    /** Drops the icons, which is what takes the rail away. */
    withoutIcons?: boolean;
    duplicateIds?: boolean;
    missingId?: boolean;
    /** Moves the current destination inside the collapsible section. */
    movedIntoGroup?: boolean;
    /** Exactly the shape the former name accepted: no ids, no icons, no groups. */
    legacyShape?: boolean;
  }

  let {
    value = "home",
    mode = "inline",
    collapsed = false,
    open = false,
    openGroups,
    onSelect,
    onCollapsedChange,
    onOpenChange,
    onOpenGroupsChange,
    closeOnNavigate = true,
    renderTrigger = true,
    returnFocusTo,
    withSlots = false,
    duplicateLabels = false,
    withoutIcons = false,
    duplicateIds = false,
    missingId = false,
    movedIntoGroup = false,
    legacyShape = false,
  }: Props = $props();

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

  const sections = $derived(
    legacyShape ? legacy : movedIntoGroup ? moved : withoutIcons ? withoutTheIcons : withIcons,
  );
  const chosen = $derived(
    duplicateIds ? sameIds : missingId ? noId : duplicateLabels ? duplicates : sections,
  );
</script>

{#if withSlots}
  <Sidebar sections={chosen} {value} {mode} {collapsed} {open} {onSelect}>
    {#snippet logo()}<span>Brand</span>{/snippet}
    {#snippet footer()}<span>Signed in</span>{/snippet}
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
