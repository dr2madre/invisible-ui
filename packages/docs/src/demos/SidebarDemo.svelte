<script>
  import Sidebar from "@invisible-ui/svelte/Sidebar.svelte";
  import Dot from "./SidebarDemoIcon.svelte";

  let active = $state("home");
  let collapsed = $state(false);
  const sections = [
    {
      label: "Main",
      items: [
        { icon: Dot, value: "home", label: "Home" },
        { icon: Dot, value: "search", label: "Search" },
        {
          icon: Dot,
          value: "alerts",
          label: "Alerts",
          badge: { label: "3 unread", content: "3" },
        },
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
    {
      label: "More",
      items: [
        { icon: Dot, value: "settings", label: "Settings" },
        {
          icon: Dot,
          value: "billing",
          label: "Billing",
          unavailable: { reason: "Ask an administrator for access" },
        },
      ],
    },
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
