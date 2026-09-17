<script>
  import Sidebar from "@design-system/svelte/Sidebar.svelte";
  import Dot from "./SidebarDemoIcon.svelte";

  let active = "home";
  let collapsed = false;
  const sections = [
    {
      label: "Main",
      items: [
        { icon: Dot, value: "home", label: "Home" },
        { icon: Dot, value: "search", label: "Search" },
        { icon: Dot, value: "alerts", label: "Alerts" },
      ],
    },
    {
      id: "reports",
      label: "Reports",
      collapsible: true,
      items: [
        { icon: Dot, value: "daily", label: "Daily" },
        { icon: Dot, value: "weekly", label: "Weekly" },
      ],
    },
    { label: "More", items: [{ icon: Dot, value: "settings", label: "Settings" }] },
  ];
</script>

<!-- The docs site already has a nav named "Main": the demo names its own. -->
<Sidebar
  {sections}
  {collapsed}
  value={active}
  onSelect={(v) => (active = v)}
  onCollapsedChange={(next) => (collapsed = next)}
  label="Example product sidebar"
/>
