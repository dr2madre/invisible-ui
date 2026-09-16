<script>
  import Sidebar from "@design-system/svelte/Sidebar.svelte";

  let active = "home";
  let collapsed = false;
  const sections = [
    {
      label: "Main",
      items: [
        { value: "home", label: "Home" },
        { value: "search", label: "Search" },
        { value: "alerts", label: "Alerts" },
      ],
    },
    {
      id: "reports",
      label: "Reports",
      collapsible: true,
      items: [
        { value: "daily", label: "Daily" },
        { value: "weekly", label: "Weekly" },
      ],
    },
    { label: "More", items: [{ value: "settings", label: "Settings" }] },
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
