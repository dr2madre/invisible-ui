<script>
  import Checkbox from "@design-system/svelte/Checkbox.svelte";
  import NavigationBar from "@design-system/svelte/NavigationBar.svelte";
  import BellIcon from "./icons/BellIcon.svelte";
  import HomeIcon from "./icons/HomeIcon.svelte";
  import LayoutIcon from "./icons/LayoutIcon.svelte";
  import SettingsIcon from "./icons/SettingsIcon.svelte";
  import UserIcon from "./icons/UserIcon.svelte";

  let section = $state("home");
  let attention = $state(true);

  const destinations = $derived([
    { value: "home", label: "Home", icon: HomeIcon },
    { value: "projects", label: "Projects", icon: LayoutIcon },
    {
      value: "alerts",
      label: "Alerts",
      icon: BellIcon,
      badge: { content: "3", label: "3 unread" },
    },
    {
      value: "reports",
      label: "Reports",
      icon: SettingsIcon,
      unavailable: { reason: "Available online only" },
    },
    {
      value: "profile",
      label: "Profile",
      icon: UserIcon,
      badge: attention ? { label: "Needs attention" } : undefined,
    },
  ]);
</script>

<div class="frame">
  <p class="section">Section: {section}</p>
  <Checkbox
    label="Profile needs attention"
    checked={attention}
    onCheckedChange={(next) => (attention = next === true)}
  />
  <!-- The docs site already has a nav named "Main": the demo names its own. -->
  <NavigationBar
    {destinations}
    value={section}
    onSelect={(next) => (section = next)}
    label="Example product navigation"
  />
</div>

<style>
  .frame {
    display: grid;
    gap: 0.75rem;
    inline-size: 24rem;
    max-inline-size: 100%;
  }
  .section {
    margin: 0;
    font-size: 0.875rem;
  }
</style>
