<script>
  import Menu from "@design-system/svelte/Menu.svelte";

  let active = "home";
  const sections = [
    {
      label: "Main",
      items: [
        { value: "home", label: "Home" },
        { value: "search", label: "Search" },
        { value: "alerts", label: "Alerts" },
        { value: "profile", label: "Profile" },
      ],
    },
    { label: "More", items: [{ value: "settings", label: "Settings" }] },
  ];
</script>

<!-- The docs site already has a nav named "Main": the demo names its own. -->
<Menu {sections} value={active} onSelect={(v) => (active = v)} label="Example product" />
