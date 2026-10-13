<script lang="ts">
  import NavigationBar from "./navigation-bar/NavigationBar.svelte";
  import Dot from "./sidebar/sidebar-icon.fixture.svelte";
  import Popover from "./popover/Popover.svelte";
  import Select from "./select/Select.svelte";
  import Tabs from "./tabs/Tabs.svelte";
  import TextField from "./text-field/TextField.svelte";

  const tabItems = [
    { value: "account", label: "Account", content: "Account settings." },
    { value: "team", label: "Team", content: "Team settings." },
  ];
  const fruit = [
    { value: "apple", label: "Apple" },
    { value: "pear", label: "Pear" },
  ];
  const sections = [
    { value: "home", label: "Home", href: "/home", icon: Dot },
    { value: "hours", label: "Hours", icon: Dot, unavailable: { reason: "Available online only" } },
  ];
</script>

<!-- Representative field, collection and overlay components: their generated
     ids wire labels, descriptions, panels and triggers. -->
<main>
  <TextField label="Full name" description="Shown on the profile." />
  <!-- A named form: the reset contract must survive the SSR-then-hydrate path. -->
  <form data-testid="hydrated-form">
    <TextField label="City" name="city" value="Turin" />
    <Select label="Fruit choice" name="fruit" items={fruit} value="pear" />
  </form>
  <Select label="Fruit" items={fruit} value="apple" />
  <Tabs label="Settings" items={tabItems} value="account" />
  <Popover>
    {#snippet triggerContent()}<span>Open details</span>{/snippet}
    <p>Details panel.</p>
  </Popover>
  <NavigationBar destinations={sections} value="home" />
</main>
