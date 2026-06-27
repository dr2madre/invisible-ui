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

<Menu {sections} value={active} onSelect={(v) => (active = v)} />
